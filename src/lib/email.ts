/**
 * FieldNine 이메일 알림 (Resend)
 * 결제 성공/실패, 한도 경고, 환영 이메일
 */
import { Resend } from 'resend';

const FROM = 'FieldNine <noreply@fieldnine.io>';

// HTML 특수문자 이스케이프 (이메일 템플릿 XSS 방지)
function h(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 빌드 시 초기화 에러 방지 — 호출 시점에 생성
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '');
}

// ── 환영 이메일 ────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: '🚀 FieldNine에 오신 것을 환영합니다!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">안녕하세요, ${h(name)}님! 👋</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">FieldNine에 오신 것을 환영합니다. AI로 웹 앱을 만들어보세요.</p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <h3 style="color:#f97316;margin:0 0 12px;">시작하는 방법</h3>
          <ol style="color:#d4d8e2;line-height:2;margin:0;padding-left:20px;">
            <li>워크스페이스 접속</li>
            <li>만들고 싶은 앱 설명 (예: "할 일 관리 앱 만들어줘")</li>
            <li>AI가 자동으로 코드 생성</li>
            <li>배포 버튼 클릭 → 링크 공유</li>
          </ol>
        </div>
        <p style="color:#6b7280;margin-bottom:16px;">스타터 플랜으로 하루 10회 무료 AI 사용이 가능합니다.</p>
        <a href="https://fieldnine.io/workspace" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">워크스페이스 시작하기 →</a>
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
        <p style="color:#9ca3af;margin-bottom:24px;">${period} 사용료 ${amount.toLocaleString()}원 결제가 실패했습니다.</p>
        <div style="background:#f8717118;border:1px solid #f87171;border-radius:10px;padding:20px;margin-bottom:24px;">
          <p style="color:#f87171;margin:0 0 8px;font-weight:600;">⚠️ 7일 이내에 결제를 완료하지 않으면 서비스가 정지됩니다.</p>
          <p style="color:#9ca3af;margin:0;font-size:14px;">카드 정보를 업데이트하거나 결제 수단을 변경해주세요.</p>
        </div>
        <a href="https://fieldnine.io/billing" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">결제 수단 업데이트 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 문의 이메일 ───────────────────────────────────────────────────────────────
export async function sendContactEmail(opts: {
  name?: string; email?: string; company?: string;
  message?: string; type?: string;
}) {
  const { name = '', email = '', company = '', message = '', type = 'inquiry' } = opts;
  return getResend().emails.send({
    from: FROM,
    to: 'support@fieldnine.io',
    replyTo: email,
    subject: `[문의] ${type === 'team_inquiry' ? '팀 플랜' : '일반'} — ${h(name)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#050508;color:#d4d8e2;border-radius:12px;">
        <h2 style="color:#f97316;margin-bottom:16px;">새 문의가 도착했습니다</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;padding:8px 0;width:80px;">이름</td><td style="color:#d4d8e2;">${h(name)}</td></tr>
          <tr><td style="color:#6b7280;padding:8px 0;">이메일</td><td style="color:#d4d8e2;"><a href="mailto:${h(email)}" style="color:#f97316;">${h(email)}</a></td></tr>
          ${company ? `<tr><td style="color:#6b7280;padding:8px 0;">회사</td><td style="color:#d4d8e2;">${h(company)}</td></tr>` : ''}
          <tr><td style="color:#6b7280;padding:8px 0;vertical-align:top;">유형</td><td style="color:#d4d8e2;">${h(type)}</td></tr>
        </table>
        ${message ? `<div style="margin-top:16px;background:#0b0b14;border-radius:8px;padding:16px;"><p style="color:#d4d8e2;margin:0;white-space:pre-wrap;">${h(message)}</p></div>` : ''}
        <p style="color:#374151;font-size:12px;margin-top:24px;">FieldNine 문의 알림</p>
      </div>
    `,
  });
}

// ── 한도 경고 이메일 (80%) ────────────────────────────────────────────────────
export async function sendLimitWarningEmail(to: string, currentAmount: number, hardLimit: number) {
  const pct = Math.round((currentAmount / hardLimit) * 100);
  return getResend().emails.send({
    from: FROM, to,
    subject: `⚠️ FieldNine AI 사용 한도 ${pct}% 도달`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#fb923c;margin-bottom:8px;">사용 한도에 근접하고 있습니다 ⚠️</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">이번 달 AI 사용량이 한도의 ${pct}%에 도달했습니다.</p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#6b7280;">현재 사용액</span>
            <span style="color:#fb923c;font-weight:700;">${currentAmount.toLocaleString()}원</span>
          </div>
          <div style="background:#1f2937;border-radius:6px;height:8px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:#fb923c;"></div>
          </div>
          <div style="text-align:right;margin-top:4px;font-size:12px;color:#6b7280;">한도: ${hardLimit.toLocaleString()}원</div>
        </div>
        <p style="color:#9ca3af;font-size:14px;margin-bottom:20px;">한도 도달 시 AI 서비스가 일시 중단됩니다. 사용량을 조절하거나 한도 증액을 요청하세요.</p>
        <a href="https://fieldnine.io/billing" style="background:#1f2937;color:#d4d8e2;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">사용량 확인하기 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}
