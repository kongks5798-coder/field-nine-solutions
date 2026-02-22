"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ── 플랜 정의 ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id:           "pro",
    name:         "프로",
    original:     49000,
    price:        39000,
    priceLabel:   "₩39,000",
    period:       "/ 월",
    badge:        "가장 인기",
    description:  "개인·소규모 팀을 위한 AI 무제한 플랜.",
    highlight:    true,
    autonomy:     "전체 (Max 포함)",
    roi:          "GPT-4o + Claude 무제한 → 월 ₩100,000+ 가치" as string | null,
    features: [
      { text: "워크스페이스 무제한", included: true },
      { text: "AI 요청 무제한", included: true },
      { text: "클라우드 스토리지 50GB", included: true },
      { text: "팀 협업 (10명)", included: true },
      { text: "우선 기술 지원", included: true },
      { text: "GPT-4o · Claude · Gemini · Grok", included: true },
      { text: "자율성 전체 (Low·Mid·High·Max)", included: true },
    ],
    cta:    "프로 시작",
    amount: 39000,
  },
  {
    id:           "team",
    name:         "팀",
    original:     129000,
    price:        99000,
    priceLabel:   "₩99,000",
    period:       "/ 월",
    badge:        "엔터프라이즈",
    description:  "성장하는 팀을 위한 완전한 솔루션.",
    highlight:    false,
    autonomy:     "전체 + 전용 지원",
    roi:          "개발자 10명 생산성 2× = 인건비 수천만원 절감" as string | null,
    features: [
      { text: "프로 모든 기능 포함", included: true },
      { text: "팀원 무제한", included: true },
      { text: "클라우드 스토리지 200GB", included: true },
      { text: "전담 계정 매니저", included: true },
      { text: "SSO / SAML 2.0", included: true },
      { text: "SLA 99.9% 보장 · 감사 로그", included: true },
      { text: "맞춤형 계약 · 볼륨 할인", included: true },
    ],
    cta:    "팀 플랜 문의",
    amount: 99000,
  },
] as const;

const T = {
  bg:      "#09101e",
  surface: "#0d1525",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#f97316",
  accentB: "#f43f5e",
  text:    "#e8eaf0",
  muted:   "rgba(255,255,255,0.45)",
  green:   "#22c55e",
  red:     "#f87171",
  blue:    "#60a5fa",
};

// ── 결제 공급자 ───────────────────────────────────────────────────────────────
type Provider = "stripe" | "toss" | "polar";

const PROVIDERS: { id: Provider; label: string; icon: string; desc: string }[] = [
  { id: "stripe", label: "Stripe", icon: "💳", desc: "글로벌 카드 결제 (Visa, Mastercard, Amex)" },
  { id: "toss",   label: "토스페이먼츠", icon: "🇰🇷", desc: "한국 카드 · 카카오페이 · 네이버페이" },
  { id: "polar",  label: "Polar",  icon: "❄️", desc: "오픈소스 구독 · 인보이스 지원" },
];

const FAQ_ITEMS = [
  { q: "언제든지 취소할 수 있나요?", a: "네. 언제든지 취소하면 남은 기간을 일할 계산해 환불합니다. 단, 해당 기간 초과 사용 금액은 차감됩니다." },
  { q: "초과 요금은 어떻게 청구되나요?", a: "월말에 자동으로 한도 초과분이 정산됩니다. Stripe/토스를 통해 등록된 결제 수단에 자동 청구됩니다." },
  { q: "결제 수단은 무엇을 지원하나요?", a: "Stripe (글로벌 카드), 토스페이먼츠 (한국 카드·카카오페이·네이버페이), Polar (인보이스·구독)를 지원합니다." },
  { q: "영수증/세금계산서 발급되나요?", a: "Stripe 및 토스페이먼츠 결제 시 자동 영수증이 발송됩니다. 세금계산서는 sales@fieldnine.io로 문의하세요." },
  { q: "팀 플랜은 어떻게 계약하나요?", a: "아래 문의 폼을 통해 연락주시면 팀 규모에 맞는 맞춤형 계약(연간·볼륨 할인)을 안내해드립니다." },
  { q: "플랜은 언제든지 변경할 수 있나요?", a: "네. 프로 → 팀 또는 팀 → 프로 변경은 언제든지 가능하며 요금은 일할 계산됩니다." },
];

export default function PricingPage() {
  const router = useRouter();
  const [user,          setUser]          = useState<{ id: string; email: string } | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading,       setLoading]       = useState<string | null>(null);
  const [provider,      setProvider]      = useState<Provider>("toss");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [toast,         setToast]         = useState("");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [tossReady,     setTossReady]     = useState(false);
  const [tossLoading,   setTossLoading]   = useState(false); // SDK 로딩 중 여부
  // TossPayments 인스턴스 캐시 — 버튼 클릭 시 재초기화 불필요
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tossRef = useRef<any>(null);
  const [faqOpen,       setFaqOpen]       = useState<number | null>(null);
  const [showContact,   setShowContact]   = useState(false);
  const [contactForm,   setContactForm]   = useState({ name: "", email: "", company: "", message: "" });
  const [contactSent,   setContactSent]   = useState(false);
  const [contactSending,setContactSending]= useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); if (d.onTrial) setTrialDaysLeft(d.trialDaysLeft); } })
      .catch(() => {});
    fetch("/api/billing/usage")
      .then(r => r.json())
      .then(d => { if (d.plan) setCurrentPlanId(d.plan); })
      .catch(() => {});

    // TossPayments SDK 마운트 시 미리 초기화 (버튼 클릭 시 재로드 없음)
    const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
    if (clientKey) {
      setTossLoading(true);
      // window.alert 일시 차단 (SDK 도메인 미등록 시 native alert 방지)
      const _origAlert = typeof window !== "undefined" ? window.alert : null;
      if (typeof window !== "undefined") window.alert = () => {};
      import("@tosspayments/tosspayments-sdk")
        .then(({ loadTossPayments }) => loadTossPayments(clientKey))
        .then(tp => {
          tossRef.current = tp;
          setTossReady(true);
          setTossLoading(false);
        })
        .catch(() => {
          setTossLoading(false);
          setTossReady(false);
        })
        .finally(() => {
          if (typeof window !== "undefined" && _origAlert) window.alert = _origAlert;
        });
    }
    // 키 미설정 시 → 버튼은 활성화된 채로, 클릭 시 "키 미설정" 안내
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const getDisplayPrice = (plan: typeof PLANS[number]) => {
    if (billingPeriod === "yearly") {
      const yearly = Math.floor(plan.price * 0.89 / 100) * 100;
      return { label: `₩${yearly.toLocaleString()}`, original: plan.price, yearlyMonthly: yearly };
    }
    return { label: plan.priceLabel, original: plan.original, yearlyMonthly: 0 };
  };

  const getAnnualSavings = (plan: typeof PLANS[number]) => {
    const yearly = Math.floor(plan.price * 0.89 / 100) * 100;
    return (plan.price - yearly) * 12;
  };

  // -- TossPayments 에러 코드 -> 한국어 메시지
  const getTossErrorMessage = (code: string): string => {
    const messages: Record<string, string> = {
      PAY_PROCESS_CANCELED:  '결제를 취소했습니다.',
      PAY_PROCESS_ABORTED:   '결제 진행 중 오류가 발생했습니다. 다시 시도해 주세요.',
      REJECT_CARD_COMPANY:   '카드사에서 결제를 거절했습니다. 다른 카드를 사용해 주세요.',
      BELOW_MINIMUM_AMOUNT:  '결제 금액이 최소 금액보다 작습니다.',
      INVALID_CARD_EXPIRATION: '카드 유효기간을 확인해 주세요.',
      INVALID_STOPPED_CARD:  '사용이 중단된 카드입니다.',
      EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 한도를 초과했습니다.',
      NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: '할부가 지원되지 않는 카드입니다.',
      INVALID_CARD_INSTALLMENT_PLAN: '할부 개월 수가 올바르지 않습니다.',
      NOT_SUPPORTED_MONTHLY_INSTALLMENT_PLAN: '해당 카드는 할부가 지원되지 않습니다.',
      EXCEED_MAX_PAYMENT_AMOUNT: '최대 결제 금액을 초과했습니다.',
      INVALID_ACCOUNT_INFO:  '계좌 정보가 올바르지 않습니다.',
      UNAUTHORIZED_KEY:      '잘못된 키입니다. 담당자에게 문의해 주세요.',
    };
    return messages[code] ?? '결제 오류가 발생했습니다. (' + code + ')';
  };

  const handlePay = async (plan: typeof PLANS[number], easyPayType?: "KAKAOPAY" | "NAVERPAY" | "TOSSPAY") => {
    if (!user) {
      router.push("/login?next=/pricing");
      return;
    }
    setLoading(plan.id);

    // ── Toss Payments ────────────────────────────────────────────────────────
    if (provider === "toss") {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
        if (!clientKey) {
          showToast("토스페이먼츠 키 미설정 — Stripe 또는 Polar로 변경해 주세요.");
          setLoading(null);
          return;
        }

        // useEffect에서 미리 초기화된 인스턴스 사용 (스크립트 재주입 없음)
        let tp = tossRef.current;
        if (!tp) {
          // 초기화 실패 시 재시도 (alert 차단 후)
          const _origAlert2 = typeof window !== "undefined" ? window.alert : null;
          if (typeof window !== "undefined") window.alert = () => {};
          try {
            const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
            tp = await loadTossPayments(clientKey);
            tossRef.current = tp;
          } finally {
            if (typeof window !== "undefined" && _origAlert2) window.alert = _origAlert2;
          }
          if (!tp) {
            showToast("결제창 로드 실패 — 잠시 후 다시 시도하거나 Stripe를 이용해주세요.");
            setLoading(null);
            return;
          }
        }

        const payment = tp.payment({ customerKey: user.id });
        const basePayload = {
          amount:        { currency: "KRW", value: plan.price },
          orderId:       `${plan.id}-${user.id}-${Date.now()}`,
          orderName:     `Dalkak ${plan.name} 플랜`,
          customerEmail: user.email,
          successUrl:    `${window.location.origin}/api/payment/confirm?plan=${plan.id}`,
          failUrl:       `${window.location.origin}/pricing?error=payment_failed`,
        };
        if (easyPayType) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (payment as any).requestPayment({ method: "EASY_PAY", easyPay: { easyPayType }, ...basePayload });
        } else {
          // CARD: 카드 + 간편결제 모두 포함
          await payment.requestPayment({ method: "CARD", ...basePayload });
        }
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        const errMsg = err.message ?? (e instanceof Error ? e.message : String(e));
        // 사용자가 직접 닫은 경우(취소) 토스트 표시 안함
        const isCanceled =
          errMsg.includes("닫혔") ||
          errMsg.includes("cancel") ||
          errMsg.includes("CANCEL") ||
          err.code === "PAY_PROCESS_CANCELED";
        if (!isCanceled) {
          const toastMsg = err.code
            ? getTossErrorMessage(err.code)
            : (errMsg.slice(0, 100) || "결제 오류가 발생했습니다.");
          showToast(toastMsg);
        }
      }
      setLoading(null);
      return;
    }

    // ── Stripe / Polar ───────────────────────────────────────────────────────
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, provider }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "결제 오류가 발생했습니다.");
      }
    } catch {
      showToast("서버 오류. 잠시 후 다시 시도해주세요.");
    }
    setLoading(null);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setContactSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, type: "team_inquiry" }),
      });
    } catch { /* ignore — show success regardless */ }
    setContactSent(true);
    setContactSending(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard",Inter,-apple-system,sans-serif' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60, position: "sticky", top: 0, zIndex: 100,
        background: "rgba(9,16,30,0.88)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <button onClick={() => router.push("/")}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#f97316,#f43f5e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>FieldNine</span>
        </button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => router.push("/")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>제품</button>
          {user ? (
            <button onClick={() => router.push("/workspace")}
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              워크스페이스 →
            </button>
          ) : (
            <>
              <button onClick={() => router.push("/login")} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>로그인</button>
              <button onClick={() => router.push("/signup")} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>무료 시작</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "72px 24px 40px" }}>
        {trialDaysLeft !== null && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 18px", borderRadius: 20, marginBottom: 16,
            border: `1px solid ${trialDaysLeft <= 3 ? "rgba(248,113,113,0.4)" : "rgba(249,115,22,0.4)"}`,
            background: trialDaysLeft <= 3 ? "rgba(248,113,113,0.1)" : "rgba(249,115,22,0.1)",
            fontSize: 13, fontWeight: 700, color: trialDaysLeft <= 3 ? T.red : T.accent,
          }}>
            {trialDaysLeft <= 3 ? "⚠️" : "⏳"}
            무료 체험 {trialDaysLeft === 0 ? "오늘 종료" : `${trialDaysLeft}일 남음`} — 지금 업그레이드하면 모든 기능 유지!
          </div>
        )}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 20,
          border: "1px solid rgba(249,115,22,0.35)",
          background: "rgba(249,115,22,0.09)",
          fontSize: 12, fontWeight: 700, color: T.accent,
          letterSpacing: "0.06em", marginBottom: 20,
        }}>✦ 지금 가입 시 20%↑ 할인 적용</div>

        <h1 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
          투명한 가격<br />
          <span style={{ background: "linear-gradient(135deg,#f97316,#f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            숨겨진 비용 없음
          </span>
        </h1>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
          무료로 시작하고, 필요할 때 업그레이드하세요.<br />
          사용한 만큼만 초과 청구됩니다.
        </p>

        {/* ── 소셜 프루프 ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(16px,4vw,48px)", marginBottom: 36, flexWrap: "wrap" }}>
          {[
            { value: "2,400+", label: "개발자 가입" },
            { value: "18,000+", label: "앱 배포" },
            { value: "120+", label: "기업 고객" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: T.text }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 월간 / 연간 토글 */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, gap: 2, marginBottom: 20, border: `1px solid ${T.border}` }}>
          {[
            { v: "monthly" as const, label: "월간" },
            { v: "yearly"  as const, label: "연간 (추가 11% 할인)" },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setBillingPeriod(v)}
              style={{
                padding: "7px 18px", borderRadius: 7, border: "none",
                background: billingPeriod === v ? "rgba(249,115,22,0.2)" : "transparent",
                color: billingPeriod === v ? T.accent : T.muted,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>{label}</button>
          ))}
        </div>

        {/* ── 신뢰 배지 ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
          {[
            { icon: "🔒", text: "SSL 보안 결제" },
            { icon: "↩", text: "14일 환불 보장" },
            { icon: "✕", text: "언제든 취소" },
            { icon: "🏅", text: "SOC2 준비 중" },
          ].map(b => (
            <div key={b.text} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              border: `1px solid rgba(255,255,255,0.1)`,
              background: "rgba(255,255,255,0.04)",
              fontSize: 12, color: T.muted,
            }}>
              <span style={{ fontSize: 12 }}>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 플랜 카드 ──────────────────────────────────────────────────────── */}
      <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, padding: "0 24px 60px", maxWidth: 1100, margin: "0 auto" }}>
        {PLANS.map(plan => {
          const dp = getDisplayPrice(plan);
          const savings = billingPeriod === "yearly" ? getAnnualSavings(plan) : 0;
          const isCurrentPlan = currentPlanId === plan.id;
          return (
            <div key={plan.id} style={{
              position: "relative",
              background: plan.highlight
                ? "linear-gradient(135deg,rgba(249,115,22,0.13),rgba(244,63,94,0.08))"
                : "rgba(255,255,255,0.03)",
              border: isCurrentPlan
                ? "1.5px solid rgba(34,197,94,0.5)"
                : plan.highlight
                  ? "1.5px solid rgba(249,115,22,0.45)"
                  : `1px solid ${T.border}`,
              borderRadius: 22, padding: "32px 28px",
              boxShadow: plan.highlight ? "0 0 60px rgba(249,115,22,0.12)" : "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = plan.highlight
                ? "0 20px 64px rgba(249,115,22,0.22)"
                : "0 16px 40px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = plan.highlight ? "0 0 60px rgba(249,115,22,0.12)" : "none";
            }}
            >
              {/* 현재 플랜 배지 */}
              {isCurrentPlan && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 16px", borderRadius: 20,
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  fontSize: 11, fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
                }}>✓ 현재 플랜</div>
              )}

              {/* 기존 뱃지 (현재 플랜이 아닐 때) */}
              {plan.badge && !isCurrentPlan && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  padding: "4px 16px", borderRadius: 20,
                  background: "linear-gradient(135deg,#f97316,#f43f5e)",
                  fontSize: 11, fontWeight: 800, color: "#fff", whiteSpace: "nowrap",
                }}>{plan.badge}</div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: plan.highlight ? T.accent : T.muted, letterSpacing: "0.08em", marginBottom: 8 }}>
                {plan.name.toUpperCase()}
              </div>

              {/* 가격 표시 */}
              <div style={{ marginBottom: 6 }}>
                {dp.original > 0 && (
                  <div style={{ fontSize: 13, color: T.muted, textDecoration: "line-through", marginBottom: 2 }}>
                    ₩{dp.original.toLocaleString()}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em" }}>{dp.label}</span>
                  {plan.period && <span style={{ fontSize: 14, color: T.muted }}>{plan.period}</span>}
                </div>

                {/* 연간 절감 표시 */}
                {savings > 0 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: "rgba(96,165,250,0.12)", color: T.blue, border: "1px solid rgba(96,165,250,0.2)",
                  }}>연 ₩{savings.toLocaleString()} 절약!</div>
                )}

                {/* 월간 할인율 배지 */}
                {dp.original > 0 && billingPeriod === "monthly" && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: "rgba(34,197,94,0.12)", color: T.green, border: "1px solid rgba(34,197,94,0.2)",
                  }}>
                    ✦ {Math.round((1 - plan.price / plan.original) * 100)}% 할인 적용 중
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: T.muted, marginBottom: 8, lineHeight: 1.55 }}>{plan.description}</p>

              {/* ROI 가치 표시 */}
              {plan.roi && (
                <div style={{
                  marginBottom: 12, padding: "6px 10px", borderRadius: 8,
                  background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)",
                  fontSize: 11, color: "rgba(249,115,22,0.8)", lineHeight: 1.5,
                }}>💡 {plan.roi}</div>
              )}

              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20, padding: "4px 10px", borderRadius: 8, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <span style={{ fontSize: 10 }}>🤖</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent }}>자율성: {plan.autonomy}</span>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <li key={f.text} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.05)`,
                    fontSize: 13.5, color: f.included ? T.text : T.muted,
                    opacity: f.included ? 1 : 0.45,
                  }}>
                    <span style={{ color: f.included ? T.green : T.muted, fontSize: 14, flexShrink: 0 }}>
                      {f.included ? "✓" : "✕"}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePay(plan)}
                disabled={loading === plan.id || isCurrentPlan || (provider === "toss" && tossLoading)}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: isCurrentPlan
                    ? "rgba(34,197,94,0.15)"
                    : plan.highlight
                      ? "linear-gradient(135deg,#f97316,#f43f5e)"
                      : "rgba(255,255,255,0.08)",
                  color: isCurrentPlan ? T.green : "#fff",
                  fontSize: 14, fontWeight: 700,
                  cursor: (loading === plan.id || isCurrentPlan || (provider === "toss" && tossLoading)) ? "default" : "pointer",
                  boxShadow: plan.highlight ? "0 4px 20px rgba(249,115,22,0.35)" : "none",
                  opacity: (loading === plan.id || (provider === "toss" && tossLoading)) ? 0.6 : 1,
                  transition: "all 0.15s", fontFamily: "inherit",
                }}
              >
                {isCurrentPlan
                  ? "✓ 현재 사용 중"
                  : loading === plan.id
                    ? "처리 중..."
                    : (provider === "toss" && tossLoading)
                      ? "결제 모듈 로드 중..."
                      : plan.cta}
              </button>

              {/* 토스 간편결제 빠른 버튼 (토스 선택 시 모든 플랜) */}
              {provider === "toss" && !isCurrentPlan && tossReady && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {([
                    { type: "KAKAOPAY", label: "카카오페이", color: "#FEE500", textColor: "#3A1D1D" },
                    { type: "NAVERPAY", label: "네이버페이", color: "#03C75A", textColor: "#fff" },
                    { type: "TOSSPAY",  label: "토스페이",   color: "#0064FF", textColor: "#fff" },
                  ] as const).map(ep => (
                    <button key={ep.type}
                      onClick={() => handlePay(plan, ep.type)}
                      disabled={!!loading}
                      style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: ep.color, color: ep.textColor, fontSize: 11, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit" }}>
                      {ep.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 팀 플랜 맞춤 계약 링크 */}
              {plan.id === "team" && !isCurrentPlan && (
                <button
                  onClick={() => { setShowContact(true); setTimeout(() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" }), 50); }}
                  style={{ width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8, border: `1px solid rgba(255,255,255,0.1)`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  대량/맞춤 계약 문의 →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 결제 수단 선택 ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
          borderRadius: 18, padding: "28px 32px",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>결제 수단 선택</h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>원하시는 결제 수단을 선택하세요. 언제든지 변경 가능합니다.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {PROVIDERS.map(p => (
              <div key={p.id} onClick={() => setProvider(p.id)}
                style={{
                  flex: "1 1 200px", padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                  border: `1.5px solid ${provider === p.id ? T.accent : T.border}`,
                  background: provider === p.id ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: provider === p.id ? T.accent : T.text, marginBottom: 3 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{p.desc}</div>
                {p.id === "toss" && !process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY && provider === p.id && (
                  <div style={{ marginTop: 8, fontSize: 10, color: T.red }}>⚠ 환경변수 미설정 — 다른 수단을 이용하거나 .env.local에 키를 추가하세요.</div>
                )}
                {provider === p.id && process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY && (
                  <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: T.accent }}>✓ 선택됨</div>
                )}
                {provider === p.id && p.id !== "toss" && (
                  <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: T.accent }}>✓ 선택됨</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 사용량 기반 요금 설명 ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 64px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 32, letterSpacing: "-0.02em" }}>
          사용한 만큼만 청구됩니다
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { title: "✦ 초과 AI 요청", desc: "스타터 100회 초과 시 자동 청구", price: "₩90 / 회", sub: "월말 자동 정산", color: T.accent },
            { title: "☁️ 초과 스토리지", desc: "플랜 한도 초과 시 자동 청구",    price: "₩9,000 / 10GB", sub: "사용한 만큼만", color: T.blue },
            { title: "↩ 환불 정책",    desc: "취소 시 남은 기간 일할 계산 환불", price: "초과 사용량 차감", sub: "3~5 영업일 처리", color: T.green },
          ].map(item => (
            <div key={item.title} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>{item.desc}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.price}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", fontSize: 13, color: T.muted, lineHeight: 1.7 }}>
          <strong style={{ color: T.accent }}>초과 자동결제 안내:</strong> 스타터 플랜에서 AI 요청이 100회를 초과하면 초과분(₩90/회)이 월말에 자동 청구됩니다. 언제든지 구독 포털에서 한도를 확인하고 플랜을 업그레이드하세요.
        </div>
      </div>

      {/* ── FAQ 아코디언 ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.02em" }}>자주 묻는 질문</h2>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <button
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "18px 0", cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 12,
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{item.q}</span>
              <span style={{
                fontSize: 18, color: T.muted, flexShrink: 0,
                transform: faqOpen === i ? "rotate(45deg)" : "rotate(0)",
                transition: "transform 0.2s",
              }}>+</span>
            </button>
            {faqOpen === i && (
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, paddingBottom: 18 }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 인라인 문의 폼 ─────────────────────────────────────────────────── */}
      <div id="contact-form" style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "36px 32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
            팀/엔터프라이즈 맞춤 문의
          </h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 28, lineHeight: 1.7 }}>
            팀 규모에 맞는 볼륨 할인 · 연간 계약 · 전용 SLA를 안내해 드립니다.<br />
            영업일 기준 1일 이내 답변드립니다.
          </p>

          {contactSent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>문의가 접수되었습니다!</div>
              <div style={{ fontSize: 13, color: T.muted }}>영업일 기준 1일 이내 {contactForm.email}로 연락드리겠습니다.</div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>이름 *</label>
                  <input
                    value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="홍길동"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>이메일 *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="hello@company.com"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>회사명</label>
                <input
                  value={contactForm.company}
                  onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="FieldNine Corp."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>문의 내용</label>
                <textarea
                  value={contactForm.message}
                  onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="팀 규모, 사용 목적, 예상 사용량 등을 알려주세요."
                  rows={4}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                disabled={contactSending || !contactForm.name || !contactForm.email}
                style={{
                  padding: "13px 0", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#f97316,#f43f5e)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  opacity: (contactSending || !contactForm.name || !contactForm.email) ? 0.5 : 1,
                  transition: "opacity 0.15s", fontFamily: "inherit",
                }}>
                {contactSending ? "전송 중..." : "문의 보내기 →"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "24px", borderTop: `1px solid rgba(255,255,255,0.05)`, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
        © 2026 FieldNine Inc. · 문의:{" "}
        <a href="mailto:support@fieldnine.io" style={{ color: "rgba(249,115,22,0.5)", textDecoration: "none" }}>support@fieldnine.io</a>
        {" "}·{" "}
        <a href="mailto:sales@fieldnine.io" style={{ color: "rgba(249,115,22,0.5)", textDecoration: "none" }}>sales@fieldnine.io</a>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,15,26,0.96)", color: T.text,
          padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)", border: `1px solid ${T.border}`,
          zIndex: 9999, whiteSpace: "nowrap", backdropFilter: "blur(16px)",
          animation: "fadeUp 0.18s ease",
        }}>{toast}</div>
      )}

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,6px)} to{opacity:1;transform:translate(-50%,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, textarea:focus { border-color: rgba(249,115,22,0.5) !important; }

        /* 모바일 그리드 반응형 */
        @media (max-width: 540px) {
          .plan-grid { grid-template-columns: 1fr !important; padding: 0 16px 48px !important; }
        }
        @media (min-width: 541px) and (max-width: 860px) {
          .plan-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
