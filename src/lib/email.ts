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
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to,
    subject: "🎉 Dalkak에 오신 것을 환영합니다!",
    headers,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">환영합니다, ${name}님! 🎉</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">Dalkak AI 개발 플랫폼에 가입해주셔서 감사합니다.</p>
        <p style="margin-bottom:24px;">지금 바로 워크스페이스를 열고 첫 번째 앱을 만들어보세요.</p>
        <a href="${SITE_URL}/workspace" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">워크스페이스 열기 →</a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
        ${footer}
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
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to, headers,
    subject: "⚡ 딸깍, 요즘 어떠세요? 새 기능이 추가됐어요",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">안녕하세요, ${name}님! ⚡</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">
          가입 후 일주일이 지났네요. Dalkak에 새 기능들이 추가됐어요.
        </p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="font-weight:700;color:#d4d8e2;margin-bottom:12px;">이번 주 새 기능</div>
          <ul style="color:#9ca3af;margin:0;padding-left:20px;line-height:1.8;">
            <li>🎯 팀 에이전트 파이프라인 — 30초 만에 완성도 높은 앱</li>
            <li>🔍 AI 코드 설명 — 만든 앱 동작 원리 즉시 이해</li>
            <li>💡 프롬프트 자동완성 — Tab 키로 아이디어 확장</li>
          </ul>
        </div>
        <a href="${SITE_URL}/workspace" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">
          워크스페이스 열기 →
        </a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">문의: support@fieldnine.io</p>
        ${footer}
      </div>
    `,
  });
}

// ── Day-30 업그레이드 넛지 ────────────────────────────────────────────────────
export async function sendUpgradeNudgeEmail(to: string, name: string, callCount: number, userId?: string) {
  const unsubUrl = await buildUnsubscribeUrl(userId, "marketing");
  const footer = unsubscribeFooterHtml(unsubUrl);
  const headers = marketingHeaders(unsubUrl);

  return getResend().emails.send({
    from: FROM, to, headers,
    subject: `🚀 ${name}님, Pro로 전환하면 AI 한도가 50배 늘어나요`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#050508;color:#d4d8e2;padding:40px 32px;border-radius:12px;">
        <h1 style="color:#f97316;margin-bottom:8px;">한달 동안 ${callCount}번 딸깍! 🚀</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">
          지난 한 달 동안 Dalkak를 열심히 사용해주셨네요.<br/>
          Pro 플랜으로 업그레이드하면 훨씬 더 많은 앱을 만들 수 있어요.
        </p>
        <div style="background:#0b0b14;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="font-weight:700;color:#d4d8e2;margin-bottom:12px;">Pro 플랜 혜택</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;">AI 호출 한도</td>
              <td style="text-align:right;color:#f97316;font-weight:700;">하루 500회 (50배↑)</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">월 요금</td>
              <td style="text-align:right;color:#22c55e;font-weight:700;">₩39,000</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">GPT-4o + Claude + Gemini</td>
              <td style="text-align:right;color:#d4d8e2;">모두 사용 가능</td>
            </tr>
          </table>
        </div>
        <a href="${SITE_URL}/pricing" style="background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:700;">
          Pro로 업그레이드 →
        </a>
        <p style="color:#374151;font-size:12px;margin-top:32px;">
          이 이메일은 한 달 이상 Dalkak를 이용하신 분들께 발송됩니다. 문의: support@fieldnine.io
        </p>
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
