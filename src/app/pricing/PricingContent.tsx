"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { track } from "@/lib/analytics";

// ── 플랜 정의 ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id:           "starter",
    name:         "무료",
    original:     0,
    price:        0,
    priceLabel:   "₩0",
    period:       "/ 영구 무료",
    badge:        null as string | null,
    description:  "개인 학습·사이드 프로젝트에 적합한 무료 플랜.",
    highlight:    false,
    autonomy:     "기본 (Low·Mid)",
    roi:          null as string | null,
    features: [
      { text: "AI 코드 생성 (일 5회)", included: true },
      { text: "프로젝트 3개", included: true },
      { text: "기본 템플릿", included: true },
      { text: "클라우드 스토리지 1GB", included: true },
      { text: "커스텀 도메인", included: false },
      { text: "팀 협업", included: false },
      { text: "우선 지원", included: false },
    ],
    cta:    "무료로 시작",
    amount: 0,
  },
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
      { text: "AI 요청 무제한", included: true },
      { text: "프로젝트 무제한", included: true },
      { text: "전체 템플릿", included: true },
      { text: "클라우드 스토리지 50GB", included: true },
      { text: "커스텀 도메인", included: true },
      { text: "팀 협업", included: false },
      { text: "우선 기술 지원", included: true },
      { text: "GPT-4o · Claude · Gemini · Grok", included: true },
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
      { text: "팀 관리 (기본 5인)", included: true },
      { text: "공유 프로젝트", included: true },
      { text: "클라우드 스토리지 200GB", included: true },
      { text: "감사 로그", included: true },
      { text: "SSO / SAML 2.0", included: true },
      { text: "SLA 99.9% 보장", included: true },
      { text: "전담 계정 매니저", included: true },
      { text: "무제한 팀원 (추가 가능)", included: true },
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

// ── TossPayments SDK 타입 보강 (EASY_PAY는 SDK 타입에 미포함) ─────────────────
interface TossPaymentsInstance {
  payment(params: { customerKey: string }): TossPaymentObject;
  widgets: unknown;
  brandpay: unknown;
}

interface TossPaymentObject {
  requestPayment(params: Record<string, unknown>): Promise<unknown>;
  requestBillingAuth?: (params: Record<string, unknown>) => Promise<unknown>;
}

// ── 결제 공급자 ───────────────────────────────────────────────────────────────
type Provider = "stripe" | "toss" | "polar";

const PROVIDERS: { id: Provider; label: string; icon: string; desc: string }[] = [
  { id: "stripe", label: "Stripe", icon: "💳", desc: "글로벌 카드 결제 (Visa, Mastercard, Amex)" },
  { id: "toss",   label: "토스페이먼츠", icon: "🇰🇷", desc: "한국 카드 · 카카오페이 · 네이버페이" },
  { id: "polar",  label: "Polar",  icon: "❄️", desc: "오픈소스 구독 · 인보이스 지원" },
];

const FAQ_ITEMS = [
  { q: "무료 플랜은 영구적인가요?", a: "네, 무료 플랜은 기간 제한 없이 영구적으로 사용하실 수 있습니다. AI 코드 생성 일 5회, 프로젝트 3개, 기본 템플릿, 클라우드 스토리지 1GB가 포함됩니다. 더 많은 기능이 필요할 때 언제든 업그레이드할 수 있습니다." },
  { q: "플랜을 중간에 변경할 수 있나요?", a: "네, 언제든지 플랜을 변경하실 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드 시 현재 결제 주기가 끝난 후 적용됩니다. 요금은 일할 계산되어 차액만 청구됩니다." },
  { q: "팀 플랜에 인원을 추가할 수 있나요?", a: "기본 5인이며, 추가 인원은 1인당 월 ₩19,000에 추가할 수 있습니다. 인원 추가는 설정 페이지에서 바로 가능하며, 10인 이상 시 볼륨 할인이 적용됩니다. 자세한 내용은 sales@fieldnine.io로 문의해주세요." },
  { q: "결제 수단은 무엇을 지원하나요?", a: "신용카드(Visa, Mastercard, Amex), 토스페이먼츠(한국 카드·카카오페이·네이버페이·토스페이), Polar(인보이스·구독)를 지원합니다. Stripe를 통한 글로벌 결제도 가능합니다." },
  { q: "환불 정책은 어떻게 되나요?", a: "결제 후 7일 이내 환불 요청 시 전액 환불됩니다. 7일 이후에는 남은 기간을 일할 계산하여 환불하며, 해당 기간 동안의 초과 사용 금액은 차감됩니다. 환불은 3~5 영업일 내 처리됩니다." },
  { q: "언제든지 취소할 수 있나요?", a: "네. 언제든지 취소하면 남은 기간을 일할 계산해 환불합니다. 단, 해당 기간 초과 사용 금액은 차감됩니다." },
  { q: "초과 요금은 어떻게 청구되나요?", a: "월말에 자동으로 한도 초과분이 정산됩니다. Stripe/토스를 통해 등록된 결제 수단에 자동 청구됩니다." },
  { q: "영수증/세금계산서 발급되나요?", a: "Stripe 및 토스페이먼츠 결제 시 자동 영수증이 발송됩니다. 세금계산서는 sales@fieldnine.io로 문의하세요." },
  { q: "팀 플랜은 어떻게 계약하나요?", a: "아래 문의 폼을 통해 연락주시면 팀 규모에 맞는 맞춤형 계약(연간·볼륨 할인)을 안내해드립니다." },
];

export default function PricingPage() {
  const router = useRouter();
  const [user,          setUser]          = useState<{ id: string; email: string } | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading,       setLoading]       = useState<string | null>(null);
  const [provider,      setProvider]      = useState<Provider>("toss");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { showToast: _showToast, toastElement } = useToast();
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [tossReady,     setTossReady]     = useState(false);
  const [tossLoading,   setTossLoading]   = useState(false); // SDK 로딩 중 여부
  // TossPayments 인스턴스 캐시 — 버튼 클릭 시 재초기화 불필요
  const tossRef = useRef<TossPaymentsInstance | null>(null);
  const [faqOpen,       setFaqOpen]       = useState<number | null>(null);
  const [showContact,   setShowContact]   = useState(false);
  const [contactForm,   setContactForm]   = useState({ name: "", email: "", company: "", message: "" });
  const [contactSent,   setContactSent]   = useState(false);
  const [contactSending,setContactSending]= useState(false);

  useEffect(() => {
    track("pricing_page_viewed", {});
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); if (d.onTrial) setTrialDaysLeft(d.trialDaysLeft); } })
      .catch((err) => { console.error('[Dalkak]', err); });
    fetch("/api/billing/usage")
      .then(r => r.json())
      .then(d => { if (d.plan) setCurrentPlanId(d.plan); })
      .catch((err) => { console.error('[Dalkak]', err); });

    // TossPayments SDK 마운트 시 미리 초기화 (버튼 클릭 시 재로드 없음)
    const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
    if (clientKey) {
      setTossLoading(true);
      // window.alert 일시 차단 (SDK 도메인 미등록 시 native alert 방지)
      const _origAlert = typeof window !== "undefined" ? window.alert : null;
      if (typeof window !== "undefined") window.alert = () => {};
      import("@tosspayments/tosspayments-sdk")
        .then(({ loadTossPayments }) => loadTossPayments(clientKey))
        .then((tp: unknown) => {
          tossRef.current = tp as unknown as TossPaymentsInstance;
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

  const showToast = useCallback((msg: string) => _showToast(msg, "info"), [_showToast]);

  const getDisplayPrice = useCallback((plan: typeof PLANS[number]) => {
    if (billingPeriod === "yearly") {
      const yearly = Math.floor(plan.price * 0.89 / 100) * 100;
      return { label: `₩${yearly.toLocaleString()}`, original: plan.price, yearlyMonthly: yearly };
    }
    return { label: plan.priceLabel, original: plan.original, yearlyMonthly: 0 };
  }, [billingPeriod]);

  const getAnnualSavings = useCallback((plan: typeof PLANS[number]) => {
    const yearly = Math.floor(plan.price * 0.89 / 100) * 100;
    return (plan.price - yearly) * 12;
  }, []);

  const tossErrorMessages = useMemo<Record<string, string>>(() => ({
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
  }), []);

  const getTossErrorMessage = useCallback((code: string): string => {
    return tossErrorMessages[code] ?? '결제 오류가 발생했습니다. (' + code + ')';
  }, [tossErrorMessages]);

  const handlePay = useCallback(async (plan: typeof PLANS[number], easyPayType?: "KAKAOPAY" | "NAVERPAY" | "TOSSPAY") => {
    // Free plan: redirect to signup/workspace
    if (plan.id === "starter") {
      if (user) {
        router.push("/workspace");
      } else {
        router.push("/signup");
      }
      return;
    }

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
        let tp: TossPaymentsInstance | null = tossRef.current;
        if (!tp) {
          // 초기화 실패 시 재시도 (alert 차단 후)
          const _origAlert2 = typeof window !== "undefined" ? window.alert : null;
          if (typeof window !== "undefined") window.alert = () => {};
          try {
            const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
            tp = await loadTossPayments(clientKey) as unknown as TossPaymentsInstance;
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
          await payment.requestPayment({ method: "EASY_PAY", easyPay: { easyPayType }, ...basePayload });
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
  }, [user, provider, showToast, getTossErrorMessage, router]);

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [contactForm]);

  const navigateHome = useCallback(() => router.push("/"), [router]);
  const navigateWorkspace = useCallback(() => router.push("/workspace"), [router]);
  const navigateLogin = useCallback(() => router.push("/login"), [router]);
  const navigateSignup = useCallback(() => router.push("/signup"), [router]);

  const toggleFaq = useCallback((i: number) => {
    setFaqOpen(prev => prev === i ? null : i);
  }, []);

  const handleShowContact = useCallback(() => {
    setShowContact(true);
    setTimeout(() => document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const handleContactName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(f => ({ ...f, name: e.target.value }));
  }, []);

  const handleContactEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(f => ({ ...f, email: e.target.value }));
  }, []);

  const handleContactCompany = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm(f => ({ ...f, company: e.target.value }));
  }, []);

  const handleContactMessage = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContactForm(f => ({ ...f, message: e.target.value }));
  }, []);

  const planDisplayData = useMemo(() => PLANS.map(plan => ({
    plan,
    dp: getDisplayPrice(plan),
    savings: billingPeriod === "yearly" ? getAnnualSavings(plan) : 0,
    isCurrentPlan: currentPlanId === plan.id,
  })), [billingPeriod, currentPlanId, getDisplayPrice, getAnnualSavings]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard",Inter,-apple-system,sans-serif' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="pricing-nav" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(12px, 3vw, 32px)", height: 60, position: "sticky", top: 0, zIndex: 100,
        background: "rgba(9,16,30,0.88)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`, gap: 8,
      }}>
        <button onClick={navigateHome}
          aria-label="Dalkak 홈으로 이동"
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", minHeight: 44, minWidth: 44, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg,#f97316,#f43f5e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>D</div>
          <span className="hide-mobile" style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Dalkak</span>
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button onClick={navigateHome} aria-label="제품 페이지로 이동" className="hide-mobile" style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", minHeight: 44 }}>제품</button>
          {user ? (
            <button onClick={navigateWorkspace}
              aria-label="워크스페이스로 이동"
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", minHeight: 44 }}>
              워크스페이스 →
            </button>
          ) : (
            <>
              <button onClick={navigateLogin} aria-label="로그인 페이지로 이동" style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", minHeight: 44 }}>로그인</button>
              <button onClick={navigateSignup} aria-label="무료 회원가입" style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", minHeight: 44 }}>무료 시작</button>
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
        <div role="radiogroup" aria-label="결제 주기 선택" style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, gap: 2, marginBottom: 20, border: `1px solid ${T.border}` }}>
          {[
            { v: "monthly" as const, label: "월간" },
            { v: "yearly"  as const, label: "연간 (추가 11% 할인)" },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setBillingPeriod(v)}
              role="radio"
              aria-checked={billingPeriod === v}
              aria-label={`${label} 결제`}
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
      <div className="plan-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, padding: "0 24px 60px", maxWidth: 1100, margin: "0 auto" }}>
        {planDisplayData.map(({ plan, dp, savings, isCurrentPlan }) => {
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
                  onClick={handleShowContact}
                  aria-label="대량 및 맞춤 계약 문의하기"
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
          borderRadius: 18, padding: "clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px)",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>결제 수단 선택</h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>원하시는 결제 수단을 선택하세요. 언제든지 변경 가능합니다.</p>
          <div role="radiogroup" aria-label="결제 수단 선택" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {PROVIDERS.map(p => (
              <div key={p.id} onClick={() => setProvider(p.id)}
                role="radio"
                aria-checked={provider === p.id}
                aria-label={`${p.label} — ${p.desc}`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProvider(p.id); } }}
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
              onClick={() => toggleFaq(i)}
              aria-expanded={faqOpen === i}
              aria-label={`FAQ: ${item.q}`}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "18px 0", cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 12,
                fontFamily: "inherit", minHeight: 48,
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
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "clamp(20px, 4vw, 36px) clamp(16px, 3vw, 32px)" }}>
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
              <div className="contact-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>이름 *</label>
                  <input
                    value={contactForm.name}
                    onChange={handleContactName}
                    placeholder="홍길동"
                    required
                    aria-label="이름"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>이메일 *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={handleContactEmail}
                    placeholder="hello@company.com"
                    required
                    aria-label="이메일"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>회사명</label>
                <input
                  value={contactForm.company}
                  onChange={handleContactCompany}
                  placeholder="FieldNine Corp."
                  aria-label="회사명"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 6 }}>문의 내용</label>
                <textarea
                  value={contactForm.message}
                  onChange={handleContactMessage}
                  placeholder="팀 규모, 사용 목적, 예상 사용량 등을 알려주세요."
                  rows={4}
                  aria-label="문의 내용"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }}
                />
              </div>
              <button
                type="submit"
                disabled={contactSending || !contactForm.name || !contactForm.email}
                aria-label="팀 문의 보내기"
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
      {toastElement}

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
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .pricing-nav { padding: 0 12px !important; }
        }
        @media (min-width: 541px) and (max-width: 860px) {
          .plan-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
