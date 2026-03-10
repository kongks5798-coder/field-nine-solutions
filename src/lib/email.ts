import { Resend } from "resend";
import { SITE_URL } from "@/lib/constants";
import { generateUnsubscribeToken } from "@/lib/unsubscribeToken";

const FROM = "Dalkak <noreply@fieldnine.io>";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

// ── Unsubscribe footer helpers ─────────────────────────────────────────────────

const FALLBACK_UNSUBSCRIBE = "mailto:support@fieldnine.io?subject=수신거부";

async function buildUnsubscribeUrl(
  userId: string | undefined,
  type: "marketing" | "all"
): Promise<string> {
  if (!userId) return FALLBACK_UNSUBSCRIBE;
  try {
    const token = await generateUnsubscribeToken(userId, type);
    return `https://fieldnine.io/unsubscribe?token=${encodeURIComponent(token)}&type=${type}`;
  } catch {
    return FALLBACK_UNSUBSCRIBE;
  }
}

function unsubscribeFooterHtml(unsubscribeUrl: string): string {
  return `
    <div style="text-align:center;padding:20px 0;border-top:1px solid #1e293b;margin-top:32px">
      <p style="color:#64748b;font-size:12px;margin:0 0 8px">
        이 이메일은 Dalkak 서비스 이용과 관련하여 발송되었습니다.
      </p>
      <a href="${unsubscribeUrl}"
         style="color:#94a3b8;font-size:12px;text-decoration:underline">
        수신 거부
      </a>
      &nbsp;·&nbsp;
      <a href="https://fieldnine.io/privacy"
         style="color:#94a3b8;font-size:12px;text-decoration:underline">
        개인정보처리방침
      </a>
    </div>`;
}

function marketingHeaders(unsubscribeUrl: string): Record<string, string> {
  // Only add List-Unsubscribe header for real token URLs (not mailto fallbacks)
  if (!unsubscribeUrl.startsWith("https://")) return {};
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// ── 가입 환영 이메일 ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to,
    subject: "딸깍에 오신 것을 환영합니다",
    headers,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#faf8f5;padding:56px 40px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#0a0a0a;text-transform:uppercase;margin-bottom:48px;">딸깍 · Dalkak</div>
        <h1 style="font-size:28px;font-weight:300;color:#0a0a0a;margin:0 0 8px;letter-spacing:-0.5px;">안녕하세요, ${name}님.</h1>
        <p style="font-size:15px;color:#3a3a3a;margin:0 0 40px;line-height:1.7;">
          AI로 웹앱을 즉시 만드는 딸깍에 가입해주셔서 감사합니다.<br/>
          한국어로 설명하면 30초 안에 완성된 앱이 만들어집니다.
        </p>
        <div style="background:#f0ede8;padding:24px;margin-bottom:40px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#6b6b6b;text-transform:uppercase;margin-bottom:16px;">시작하는 방법</div>
          <div style="font-size:14px;color:#0a0a0a;line-height:2;">
            <div>① 워크스페이스로 이동</div>
            <div>② 만들고 싶은 앱을 한국어로 설명</div>
            <div>③ 30초 후 완성된 앱을 즉시 배포</div>
          </div>
        </div>
        <a href="${SITE_URL}/workspace" style="display:inline-block;background:#0a0a0a;color:#faf8f5;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.02em;">워크스페이스 열기</a>
        <div style="margin-top:56px;padding-top:24px;border-top:1px solid #e0ddd8;">
          <p style="font-size:12px;color:#9a9a9a;margin:0 0 6px;">FieldNine · Seoul, Korea</p>
          <p style="font-size:12px;color:#9a9a9a;margin:0;">
            수신 거부:
            <a href="${unsubUrl}" style="color:#9a9a9a;">여기를 클릭하세요</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── 결제 영수증 이메일 ────────────────────── (transactional — no unsubscribe) ──
export async function sendReceiptEmail(opts: {
  to: string;
  userName?: string;
  planName: string;
  amount: number; // 원 단위
  orderId: string;
  paidAt: string; // ISO date string
}) {
  const { to, userName, planName, amount, orderId, paidAt } = opts;
  const displayName = userName ?? "고객";
  const formattedDate = new Date(paidAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });

  return getResend().emails.send({
    from: FROM, to,
    subject: `[딸깍] 결제 영수증 — ${planName} ${amount.toLocaleString()}원`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <div style="margin-bottom:28px;">
          <span style="font-size:22px;font-weight:900;color:#f97316;letter-spacing:-0.5px;">딸깍</span>
          <span style="color:#475569;font-size:14px;margin-left:8px;">by FieldNine</span>
        </div>
        <h1 style="color:#22c55e;font-size:22px;margin-bottom:6px;">결제가 완료되었습니다 ✅</h1>
        <p style="color:#94a3b8;margin-bottom:28px;">${displayName}님, 결제해주셔서 감사합니다.</p>
        <div style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:24px;margin-bottom:28px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="color:#64748b;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">플랜</td>
              <td style="text-align:right;color:#f0f4f8;font-weight:600;border-bottom:1px solid rgba(255,255,255,0.05);">${planName}</td>
            </tr>
            <tr>
              <td style="color:#64748b;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">주문번호</td>
              <td style="text-align:right;color:#94a3b8;font-size:12px;font-family:monospace;border-bottom:1px solid rgba(255,255,255,0.05);">${orderId}</td>
            </tr>
            <tr>
              <td style="color:#64748b;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">결제일시</td>
              <td style="text-align:right;color:#f0f4f8;border-bottom:1px solid rgba(255,255,255,0.05);">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color:#64748b;padding:14px 0 8px;font-weight:600;font-size:15px;">결제 금액</td>
              <td style="text-align:right;color:#f97316;font-size:22px;font-weight:800;padding-top:14px;">${amount.toLocaleString()}원</td>
            </tr>
          </table>
        </div>
        <a href="${SITE_URL}/billing"
           style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;font-size:14px;">
          청구 내역 확인 →
        </a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">
          소비된 서비스는 환불이 불가합니다. 문의: support@fieldnine.io
        </p>
      </div>
    `,
  });
}

// ── 결제 성공 이메일 ─────────────────────── (transactional — no unsubscribe) ──
export async function sendPaymentSuccessEmail(to: string, plan: string, amount: number, period: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `✅ Dalkak ${period} 청구 완료 — ${amount.toLocaleString()}원`,
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
        <a href="${SITE_URL}/billing" style="background:#1f2937;color:#d4d8e2;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">청구 내역 보기 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">소비된 서비스는 환불이 불가합니다. 문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 결제 실패 이메일 ─────────────────────── (transactional — no unsubscribe) ──
export async function sendPaymentFailedEmail(to: string, amount: number, period: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `❌ Dalkak 결제 실패 — 카드를 확인해주세요`,
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
        <a href="${SITE_URL}/billing" style="background:#f87171;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">결제 수단 업데이트 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}

// ── 문의 이메일 ─────────────────────────── (internal — no unsubscribe) ────────
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
export async function sendTrialExpiringEmail(to: string, daysLeft: number, plan: string, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to,
    subject: `⏰ Dalkak 무료 체험이 ${daysLeft}일 후 종료됩니다`,
    headers,
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
        <a href="${SITE_URL}/pricing" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">지금 업그레이드 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">체험 종료 후에는 무료 플랜으로 자동 전환됩니다. 문의: support@fieldnine.io</p>
        ${footer}
      </div>
    `,
  });
}

// ── 한도 경고 이메일 ──────────────────────────────────────────────────────────
export async function sendLimitWarningEmail(to: string, currentAmount: number, hardLimit: number, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to,
    subject: `⚠️ Dalkak 월 한도의 80%에 도달했습니다`,
    headers,
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
        <a href="${SITE_URL}/billing" style="background:#1f2937;color:#d4d8e2;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">사용량 확인 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
        ${footer}
      </div>
    `,
  });
}

// ── 관리자 플랜 변경 알림 이메일 ──────────────────────────────────────────────
export async function sendPlanChangedEmail(to: string, plan: string | null, userId?: string) {
  const subject = plan
    ? `🎉 Dalkak 플랜이 ${plan.toUpperCase()}로 변경되었습니다`
    : `ℹ️ Dalkak 플랜이 해제되었습니다`;
  const bodyTitle   = plan ? `플랜이 업그레이드되었습니다 🎉` : `플랜이 해제되었습니다`;
  const bodyColor   = plan ? "#22c55e" : "#6b7280";
  const bodyMessage = plan
    ? `귀하의 계정이 <strong>${plan.toUpperCase()}</strong> 플랜으로 설정되었습니다. 모든 기능을 이용할 수 있습니다.`
    : `귀하의 계정이 무료 플랜으로 변경되었습니다. 업그레이드를 원하시면 아래 버튼을 클릭하세요.`;

  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to, subject, headers,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:${bodyColor};margin-bottom:8px;">${bodyTitle}</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">${bodyMessage}</p>
        <a href="${SITE_URL}/${plan ? "workspace" : "pricing"}" style="background:${plan ? "linear-gradient(135deg,#f97316,#f43f5e)" : "#1f2937"};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">
          ${plan ? "워크스페이스 열기 →" : "플랜 업그레이드 →"}
        </a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">자동 발송 메일입니다. 문의: support@fieldnine.io</p>
        ${footer}
      </div>
    `,
  });
}

// ── Day-7 재방문 넛지 ─────────────────────────────────────────────────────────
export async function sendReEngagementEmail(to: string, name: string, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to, headers,
    subject: "돌아오세요, " + name + "님 — 딸깍이 기다리고 있어요",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#faf8f5;padding:56px 40px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#0a0a0a;text-transform:uppercase;margin-bottom:48px;">딸깍 · Dalkak</div>
        <h1 style="font-size:26px;font-weight:300;color:#0a0a0a;margin:0 0 8px;letter-spacing:-0.5px;">돌아오세요, ${name}님.</h1>
        <p style="font-size:15px;color:#3a3a3a;margin:0 0 40px;line-height:1.7;">
          가입하신 지 일주일이 지났네요. 아직 첫 앱을 못 만드셨나요?<br/>
          지금 딸깍에는 새로운 기능들이 추가되었습니다.
        </p>
        <div style="background:#f0ede8;padding:24px;margin-bottom:40px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#6b6b6b;text-transform:uppercase;margin-bottom:16px;">이런 앱을 30초에 만들 수 있어요</div>
          <div style="font-size:14px;color:#0a0a0a;line-height:2.2;">
            <div>— 쇼핑몰 랜딩 페이지</div>
            <div>— 포트폴리오 사이트</div>
            <div>— 인터랙티브 계산기 / 퀴즈 앱</div>
            <div>— 실시간 데이터 대시보드</div>
          </div>
        </div>
        <a href="${SITE_URL}/workspace" style="display:inline-block;background:#0a0a0a;color:#faf8f5;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.02em;">지금 만들어보기</a>
        <div style="margin-top:56px;padding-top:24px;border-top:1px solid #e0ddd8;">
          <p style="font-size:12px;color:#9a9a9a;margin:0 0 6px;">FieldNine · Seoul, Korea</p>
          <p style="font-size:12px;color:#9a9a9a;margin:0;">
            더 이상 받지 않으시려면:
            <a href="${unsubUrl}" style="color:#9a9a9a;">수신 거부</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Day-30 업그레이드 넛지 ────────────────────────────────────────────────────
export async function sendUpgradeNudgeEmail(to: string, name: string, appsCount: number, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to, headers,
    subject: name + "님, 한 달 동안 " + String(appsCount) + "개 앱을 만드셨네요",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#faf8f5;padding:56px 40px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#0a0a0a;text-transform:uppercase;margin-bottom:48px;">딸깍 · Dalkak</div>
        <h1 style="font-size:26px;font-weight:300;color:#0a0a0a;margin:0 0 8px;letter-spacing:-0.5px;">${name}님, 대단해요.</h1>
        <p style="font-size:15px;color:#3a3a3a;margin:0 0 40px;line-height:1.7;">
          지난 한 달 동안 딸깍으로 <strong>${appsCount}개</strong>의 앱을 만드셨습니다.<br/>
          Pro 플랜으로 전환하면 한도 없이 계속 만들 수 있어요.
        </p>
        <div style="background:#f0ede8;padding:24px;margin-bottom:40px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.1em;color:#6b6b6b;text-transform:uppercase;margin-bottom:20px;">Pro 플랜</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;color:#3a3a3a;border-bottom:1px solid #e0ddd8;">AI 호출 한도</td>
              <td style="padding:10px 0;text-align:right;color:#0a0a0a;font-weight:600;border-bottom:1px solid #e0ddd8;">하루 500회</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#3a3a3a;border-bottom:1px solid #e0ddd8;">GPT-4o · Claude · Gemini</td>
              <td style="padding:10px 0;text-align:right;color:#0a0a0a;font-weight:600;border-bottom:1px solid #e0ddd8;">모두 포함</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#3a3a3a;">월 요금</td>
              <td style="padding:10px 0;text-align:right;color:#0a0a0a;font-weight:700;font-size:18px;">₩39,000</td>
            </tr>
          </table>
        </div>
        <a href="${SITE_URL}/pricing" style="display:inline-block;background:#0a0a0a;color:#faf8f5;padding:14px 32px;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.02em;">Pro로 업그레이드</a>
        <div style="margin-top:56px;padding-top:24px;border-top:1px solid #e0ddd8;">
          <p style="font-size:12px;color:#9a9a9a;margin:0 0 6px;">FieldNine · Seoul, Korea</p>
          <p style="font-size:12px;color:#9a9a9a;margin:0;">
            더 이상 받지 않으시려면:
            <a href="${unsubUrl}" style="color:#9a9a9a;">수신 거부</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── 주간 AI 분석 리포트 이메일 ────────────────────────────────────────────────
export async function sendWeeklyReportEmail(opts: {
  to: string;
  userName?: string;
  totalApps: number;
  totalViews: number;
  topApp?: { name: string; views: number };
  weeklyCreated: number;
  userId?: string;
}) {
  const { to, userName, totalApps, totalViews, topApp, weeklyCreated, userId } = opts;
  const displayName = userName ?? "사용자";

  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  const weekStr = (() => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysFromMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" });
    return `${fmt(monday)} ~ ${fmt(sunday)}`;
  })();

  return getResend().emails.send({
    from: FROM, to,
    subject: `[딸깍 주간 리포트] ${weekStr} — ${displayName}님의 앱 현황`,
    headers,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <!-- 헤더 -->
        <div style="display:flex;align-items:center;margin-bottom:28px;">
          <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#f97316,#f43f5e);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;margin-right:12px;">D</div>
          <div>
            <div style="font-size:18px;font-weight:900;color:#f0f4f8;letter-spacing:-0.5px;">딸깍 주간 리포트</div>
            <div style="font-size:12px;color:#475569;">${weekStr}</div>
          </div>
        </div>

        <!-- 인사 -->
        <h1 style="color:#f0f4f8;font-size:22px;font-weight:800;margin-bottom:6px;">안녕하세요, ${displayName}님!</h1>
        <p style="color:#94a3b8;margin-bottom:28px;">지난 주 딸깍 활동 리포트입니다. 계속 멋진 앱을 만들어주세요!</p>

        <!-- 핵심 지표 카드 3개 -->
        <div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#f97316;line-height:1;">${totalViews.toLocaleString()}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">총 조회수</div>
          </div>
          <div style="flex:1;min-width:120px;background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#22c55e;line-height:1;">${totalApps}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">배포한 앱</div>
          </div>
          <div style="flex:1;min-width:120px;background:#0d1117;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#60a5fa;line-height:1;">${weeklyCreated}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px;">이번 주 생성</div>
          </div>
        </div>

        <!-- 인기 앱 -->
        ${topApp ? `
        <div style="background:#0d1117;border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px;margin-bottom:28px;">
          <div style="font-size:12px;font-weight:700;color:#f97316;letter-spacing:0.06em;margin-bottom:10px;">이번 주 가장 인기 앱</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <div style="font-size:16px;font-weight:700;color:#f0f4f8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${topApp.name}</div>
            <div style="flex-shrink:0;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;color:#f97316;">
              👁 ${topApp.views.toLocaleString()}회
            </div>
          </div>
        </div>
        ` : ""}

        <!-- 격려 메시지 -->
        <div style="background:linear-gradient(135deg,rgba(249,115,22,0.06),rgba(244,63,94,0.06));border:1px solid rgba(249,115,22,0.15);border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">✨</div>
          <div style="font-size:14px;color:#d4d8e2;line-height:1.6;">
            ${totalViews > 0
              ? `내 앱이 <strong style="color:#f97316">${totalViews.toLocaleString()}번</strong> 조회됐어요! 계속 공유해서 더 많은 사람들에게 닿아보세요.`
              : "첫 번째 앱을 배포하고 더 많은 사람들과 공유해보세요!"}
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${SITE_URL}/workspace"
             style="display:inline-block;background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:-0.01em;">
            새 앱 만들기 →
          </a>
        </div>

        <p style="color:#374151;font-size:12px;text-align:center;">자동 발송 메일입니다. 문의: support@fieldnine.io</p>
        ${footer}
      </div>
    `,
  });
}

// ── 이메일 인증 OTP ─────────────────────── (transactional — no unsubscribe) ──
export async function sendEmailVerificationOtp(to: string, otp: string) {
  return getResend().emails.send({
    from: FROM, to,
    subject: `[Dalkak] 이메일 인증 코드: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">이메일 인증 ✉️</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">아래 6자리 코드를 입력해서 이메일을 인증해주세요. 코드는 10분 후 만료됩니다.</p>
        <div style="background:#0b0b14;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#f97316;font-family:monospace;">${otp}</div>
        </div>
        <p style="color:#6b7280;font-size:12px;">이 코드를 요청하지 않으셨나요? 이 이메일을 무시하세요.</p>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
      </div>
    `,
  });
}
