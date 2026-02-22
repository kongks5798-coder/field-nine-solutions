import { Resend } from "resend";

const FROM = "Dalkak <noreply@fieldnine.io>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

// ── 가입 환영 이메일 ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: "🎉 FieldNine에 오신 것을 환영합니다!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">환영합니다, ${name}님! 🎉</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">FieldNine AI 개발 플랫폼에 가입해주셔서 감사합니다.</p>
        <p style="margin-bottom:24px;">지금 바로 워크스페이스를 열고 첫 번째 앱을 만들어보세요.</p>
        <a href="https://fieldnine.io/workspace" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">워크스페이스 열기 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 결제 성공 이메일 ──────────────────────────────────────────────────────────
export async function sendPaymentSuccessEmail(to: string, plan: string, amount: number, period: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `✅ FieldNine ${period} 청구 완료 — ${amount.toLocaleString()}원`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#22c55e;margin-bottom:8px;">결제가 완료되었습니다 ✅</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">${period} 사용료가 정상 처리되었습니다.</p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;padding:8px 0;">청구 기간</td><td style="text-align:right;color:#d4d8e2;">${period}</td></tr>
            <tr><td style="color:#6b7280;padding:8px 0;">플랜</td><td style="text-align:right;color:#d4d8e2;">${plan.toUpperCase()}</td></tr>
            <tr style="border-top:1px solid #1f2937;"><td style="color:#6b7280;padding:12px 0 8px;font-weight:600;">청구 금액</td><td style="text-align:right;color:#f97316;font-size:20px;font-weight:700;">${amount.toLocaleString()}원</td></tr>
          </table>
        </div>
        <a href="https://fieldnine.io/billing" style="background:#1f2937;color:#d4d8e2;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">청구 내역 보기 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">소비된 서비스는 환불이 불가합니다. 문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 결제 실패 이메일 ──────────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, amount: number, period: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `❌ FieldNine 결제 실패 — 카드를 확인해주세요`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f87171;margin-bottom:8px;">결제에 실패했습니다 ❌</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">${period} 사용료 청구에 실패했습니다. 결제 수단을 확인해주세요.</p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;padding:8px 0;">청구 기간</td><td style="text-align:right;color:#d4d8e2;">${period}</td></tr>
            <tr style="border-top:1px solid #1f2937;"><td style="color:#6b7280;padding:12px 0 8px;font-weight:600;">청구 금액</td><td style="text-align:right;color:#f87171;font-size:20px;font-weight:700;">${amount.toLocaleString()}원</td></tr>
          </table>
        </div>
        <a href="https://fieldnine.io/billing" style="background:#f87171;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">결제 수단 업데이트 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 문의 이메일 ───────────────────────────────────────────────────────────────
export async function sendContactEmail(opts: {
  name: string; email: string; company?: string; message?: string; type?: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to: "sales@fieldnine.io",
    subject: `[문의] ${opts.name} — ${opts.company ?? "개인"}`,
    replyTo: opts.email,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>새 문의가 접수되었습니다</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#6b7280;">이름</td><td style="padding:8px;">${opts.name}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">이메일</td><td style="padding:8px;">${opts.email}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;">회사</td><td style="padding:8px;">${opts.company ?? "—"}</td></tr>
          <tr><td style="padding:8px;color:#6b7280;vertical-align:top;">내용</td><td style="padding:8px;">${opts.message}</td></tr>
        </table>
      </div>
    `,
  });
}

// ── 무료체험 만료 예정 이메일 ─────────────────────────────────────────────────
export async function sendTrialExpiringEmail(to: string, daysLeft: number, plan: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `⏰ FieldNine 무료 체험이 ${daysLeft}일 후 종료됩니다`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">무료 체험 종료 ${daysLeft}일 전 ⏰</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">
          ${plan.toUpperCase()} 플랜 무료 체험이 <strong>${daysLeft}일</strong> 후 종료됩니다.<br/>
          체험 종료 후에는 무료 플랜으로 자동 전환됩니다.
        </p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="margin:0;color:#9ca3af;">Pro 플랜 유지 시 계속 사용 가능:</p>
          <ul style="color:#d4d8e2;margin:12px 0 0;padding-left:20px;">
            <li>AI 요청 무제한</li><li>클라우드 스토리지 50GB</li>
            <li>GPT-4o · Claude · Gemini 통합</li><li>팀 협업 (10명)</li>
          </ul>
        </div>
        <a href="https://fieldnine.io/pricing" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">지금 업그레이드 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">체험 종료 후에는 무료 플랜으로 자동 전환됩니다. 문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 한도 경고 이메일 ──────────────────────────────────────────────────────────
export async function sendLimitWarningEmail(to: string, currentAmount: number, hardLimit: number) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `⚠️ FieldNine 월 한도의 80%에 도달했습니다`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#fbbf24;margin-bottom:8px;">월 한도 경고 ⚠️</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">이번 달 AI 사용료가 한도의 80%에 도달했습니다.</p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;padding:8px 0;">현재 누적 금액</td><td style="text-align:right;color:#fbbf24;font-weight:700;">${currentAmount.toLocaleString()}원</td></tr>
            <tr><td style="color:#6b7280;padding:8px 0;">월 한도</td><td style="text-align:right;color:#d4d8e2;">${hardLimit.toLocaleString()}원</td></tr>
          </table>
        </div>
        <a href="https://fieldnine.io/billing" style="background:#1f2937;color:#d4d8e2;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">사용량 확인 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 관리자 플랜 변경 알림 이메일 ──────────────────────────────────────────────
export async function sendPlanChangedEmail(to: string, plan: string | null) {
  const subject = plan
    ? `🎉 FieldNine 플랜이 ${plan.toUpperCase()}로 변경되었습니다`
    : `ℹ️ FieldNine 플랜이 해제되었습니다`;
  const bodyTitle   = plan ? `플랜이 업그레이드되었습니다 🎉` : `플랜이 해제되었습니다`;
  const bodyColor   = plan ? "#22c55e" : "#6b7280";
  const bodyMessage = plan
    ? `귀하의 계정이 <strong>${plan.toUpperCase()}</strong> 플랜으로 설정되었습니다. 모든 기능을 이용할 수 있습니다.`
    : `귀하의 계정이 무료 플랜으로 변경되었습니다. 업그레이드를 원하시면 아래 버튼을 클릭하세요.`;
  return getResend().emails.send({
    from: FROM, to, subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:${bodyColor};margin-bottom:8px;">${bodyTitle}</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">${bodyMessage}</p>
        <a href="https://fieldnine.io/${plan ? "workspace" : "pricing"}" style="background:${plan ? "linear-gradient(135deg,#f97316,#f43f5e)" : "#1f2937"};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">
          ${plan ? "워크스페이스 열기 →" : "플랜 업그레이드 →"}
        </a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">자동 발송 메일입니다. 문의: support@fieldnine.io</p>
      </div>
    `,
  });
}
