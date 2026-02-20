"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── 플랜 정의 ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id:           "starter",
    name:         "스타터",
    original:     0,
    price:        0,
    priceLabel:   "무료",
    period:       "",
    badge:        null,
    description:  "지금 바로 시작. 신용카드 불필요.",
    highlight:    false,
    features: [
      { text: "워크스페이스 3개", included: true },
      { text: "AI 코드 생성 월 100회", included: true },
      { text: "클라우드 스토리지 1GB", included: true },
      { text: "기본 팀 협업 (3명)", included: true },
      { text: "커뮤니티 지원", included: true },
      { text: "고급 AI 모델", included: false },
      { text: "우선 지원", included: false },
    ],
    cta:    "무료로 시작",
    amount: 0,
  },
  {
    id:           "pro",
    name:         "프로",
    original:     49000,   // 정가 ₩49,000
    price:        39000,   // 할인가 ₩39,000 (20% ↓)
    priceLabel:   "₩39,000",
    period:       "/ 월",
    badge:        "가장 인기",
    description:  "전문 개발자를 위한 모든 기능. AI 무제한.",
    highlight:    true,
    features: [
      { text: "워크스페이스 무제한", included: true },
      { text: "AI 요청 무제한", included: true },
      { text: "50GB 클라우드 스토리지", included: true },
      { text: "팀 협업 (10명)", included: true },
      { text: "우선 지원", included: true },
      { text: "API 직접 연동", included: true },
      { text: "GPT-4o · Claude Sonnet · Grok 3", included: true },
    ],
    cta:    "프로 시작",
    amount: 39000,
  },
  {
    id:           "team",
    name:         "팀",
    original:     129000,  // 정가 ₩129,000
    price:        99000,   // 할인가 ₩99,000 (23% ↓)
    priceLabel:   "₩99,000",
    period:       "/ 월",
    badge:        null,
    description:  "조직 전체를 위한 엔터프라이즈 플랫폼.",
    highlight:    false,
    features: [
      { text: "프로 모든 기능 포함", included: true },
      { text: "팀원 무제한", included: true },
      { text: "200GB 클라우드 스토리지", included: true },
      { text: "전담 매니저", included: true },
      { text: "SSO / SAML", included: true },
      { text: "SLA 보장", included: true },
      { text: "맞춤형 계약", included: true },
    ],
    cta:    "영업팀 문의",
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
};

// ── 결제 공급자 ───────────────────────────────────────────────────────────────
type Provider = "stripe" | "toss" | "polar";

const PROVIDERS: { id: Provider; label: string; icon: string; desc: string }[] = [
  { id: "stripe", label: "Stripe", icon: "💳", desc: "글로벌 카드 결제 (Visa, Mastercard, Amex)" },
  { id: "toss",   label: "토스페이먼츠", icon: "🇰🇷", desc: "한국 카드 · 카카오페이 · 네이버페이" },
  { id: "polar",  label: "Polar",  icon: "❄️", desc: "오픈소스 구독 · 인보이스 지원" },
];

export default function PricingPage() {
  const router = useRouter();
  const [user,     setUser]     = useState<{ id: string; email: string } | null>(null);
  const [loading,  setLoading]  = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>("stripe");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [toast,    setToast]    = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const getDisplayPrice = (plan: typeof PLANS[number]) => {
    if (plan.amount === 0) return { label: "무료", original: 0 };
    if (billingPeriod === "yearly") {
      const yearly = Math.round(plan.price * 10 / 9000) * 9000; // 연간 ~11% 추가 할인
      return { label: `₩${yearly.toLocaleString()}`, original: plan.original };
    }
    return { label: plan.priceLabel, original: plan.original };
  };

  const handlePay = async (plan: typeof PLANS[number]) => {
    if (!user) {
      router.push("/login?next=/pricing");
      return;
    }
    if (plan.amount === 0) {
      router.push("/workspace");
      return;
    }
    if (plan.id === "team") {
      window.location.href = "mailto:sales@fieldnine.io?subject=팀 플랜 문의";
      return;
    }

    setLoading(plan.id);

    // ── Toss Payments ────────────────────────────────────────────────────────
    if (provider === "toss") {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
        if (!clientKey) { showToast("토스페이먼츠 미설정"); setLoading(null); return; }
        const tp = await loadTossPayments(clientKey);
        const payment = tp.payment({ customerKey: user.id });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: plan.price },
          orderId: `${plan.id}-${user.id}-${Date.now()}`,
          orderName: `FieldNine ${plan.name} 플랜`,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/api/payment/confirm?plan=${plan.id}`,
          failUrl:    `${window.location.origin}/pricing?error=payment_failed`,
        });
      } catch (e: unknown) {
        if (e instanceof Error && !e.message.includes("닫혔")) showToast("결제 오류: " + e.message);
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
        showToast(data.error || "결제 오류");
      }
    } catch {
      showToast("서버 오류");
    }
    setLoading(null);
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
      <div style={{ textAlign: "center", padding: "80px 24px 48px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 20,
          border: "1px solid rgba(249,115,22,0.35)",
          background: "rgba(249,115,22,0.09)",
          fontSize: 12, fontWeight: 700, color: T.accent,
          letterSpacing: "0.06em", marginBottom: 22,
        }}>✦ 지금 가입 시 20%↑ 할인 적용</div>

        <h1 style={{ fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
          투명한 가격<br />
          <span style={{ background: "linear-gradient(135deg,#f97316,#f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            숨겨진 비용 없음
          </span>
        </h1>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
          무료로 시작하고, 필요할 때 업그레이드하세요.<br />
          사용한 만큼만 초과 청구됩니다.
        </p>

        {/* 월간 / 연간 토글 */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, gap: 2, marginBottom: 48, border: `1px solid ${T.border}` }}>
          {[
            { v: "monthly" as const, label: "월간" },
            { v: "yearly"  as const, label: "연간 (추가 할인)" },
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
      </div>

      {/* ── 플랜 카드 ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", padding: "0 24px 60px", maxWidth: 1100, margin: "0 auto" }}>
        {PLANS.map(plan => {
          const dp = getDisplayPrice(plan);
          return (
            <div key={plan.id} style={{
              flex: "1 1 300px", maxWidth: 360, position: "relative",
              background: plan.highlight
                ? "linear-gradient(135deg,rgba(249,115,22,0.13),rgba(244,63,94,0.08))"
                : "rgba(255,255,255,0.03)",
              border: plan.highlight ? "1.5px solid rgba(249,115,22,0.45)" : `1px solid ${T.border}`,
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
              {plan.badge && (
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

              {/* 가격 표시: 정가 취소선 + 할인가 */}
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
                {plan.amount > 0 && dp.original > 0 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: "rgba(34,197,94,0.12)", color: T.green, border: "1px solid rgba(34,197,94,0.2)",
                  }}>
                    ✦ {Math.round((1 - plan.price / plan.original) * 100)}% 할인 적용 중
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: T.muted, marginBottom: 24, lineHeight: 1.55 }}>{plan.description}</p>

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
                disabled={loading === plan.id}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: plan.highlight
                    ? "linear-gradient(135deg,#f97316,#f43f5e)"
                    : "rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: loading === plan.id ? "wait" : "pointer",
                  boxShadow: plan.highlight ? "0 4px 20px rgba(249,115,22,0.35)" : "none",
                  opacity: loading === plan.id ? 0.7 : 1,
                  transition: "all 0.15s", fontFamily: "inherit",
                }}
              >
                {loading === plan.id ? "처리 중..." : plan.cta}
              </button>
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
                {provider === p.id && (
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
            {
              title: "✦ 초과 AI 요청",
              desc: "스타터 100회 초과 시 자동 청구",
              price: "₩90 / 회",
              sub: "월말 자동 정산",
              color: T.accent,
            },
            {
              title: "☁️ 초과 스토리지",
              desc: "플랜 한도 초과 시 자동 청구",
              price: "₩9,000 / 10GB",
              sub: "사용한 만큼만",
              color: "#60a5fa",
            },
            {
              title: "↩ 환불 정책",
              desc: "취소 시 남은 기간 일할 계산 환불",
              price: "초과 사용량 차감",
              sub: "3~5 영업일 처리",
              color: T.green,
            },
          ].map(item => (
            <div key={item.title} style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "20px 22px",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>{item.desc}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.price}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 20, padding: "16px 20px", borderRadius: 12,
          background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)",
          fontSize: 13, color: T.muted, lineHeight: 1.7,
        }}>
          <strong style={{ color: T.accent }}>초과 자동결제 안내:</strong> 스타터 플랜에서 AI 요청이 100회를 초과하면 초과분(₩90/회)이 월말에 자동 청구됩니다. 언제든지 구독 포털에서 한도를 확인하고 플랜을 업그레이드하세요.
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 24, fontWeight: 800, marginBottom: 32, letterSpacing: "-0.02em" }}>자주 묻는 질문</h2>
        {[
          { q: "언제든지 취소할 수 있나요?", a: "네. 언제든지 취소하면 남은 기간을 일할 계산해 환불합니다. 단, 해당 기간 초과 사용 금액은 차감됩니다." },
          { q: "초과 요금은 어떻게 청구되나요?", a: "월말에 자동으로 한도 초과분이 정산됩니다. Stripe/토스를 통해 등록된 결제 수단에 자동 청구됩니다." },
          { q: "결제 수단은 무엇을 지원하나요?", a: "Stripe (글로벌 카드), 토스페이먼츠 (한국 카드·카카오페이·네이버페이), Polar (인보이스·구독)를 지원합니다." },
          { q: "영수증/세금계산서 발급되나요?", a: "Stripe 및 토스페이먼츠 결제 시 자동 영수증이 발송됩니다. 세금계산서는 sales@fieldnine.io로 문의하세요." },
          { q: "팀 플랜은 어떻게 계약하나요?", a: "영업팀에 문의하시면 팀 규모에 맞는 맞춤형 계약(연간·볼륨 할인)을 안내해드립니다." },
        ].map(item => (
          <div key={item.q} style={{ padding: "18px 0", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: T.text }}>{item.q}</div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{item.a}</div>
          </div>
        ))}
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
      `}</style>
    </div>
  );
}
