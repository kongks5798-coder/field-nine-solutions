"use client";
import { useState } from "react";
import { T } from "./workspace.constants";

interface TopUpModalProps {
  currentSpent: number;
  hardLimit:    number;
  periodReset:  string;
  onClose:      () => void;
}

const OPTIONS = [
  { amount: 10000, label: "₩10,000",  desc: "약 200회 요청",   badge: "" },
  { amount: 20000, label: "₩20,000",  desc: "약 500회 요청",   badge: "추천" },
  { amount: 50000, label: "₩50,000",  desc: "약 1,500회 요청", badge: "최저 단가" },
];

export function TopUpModal({ currentSpent, hardLimit, periodReset, onClose }: TopUpModalProps) {
  const [selected, setSelected] = useState(20000);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const usedPct = Math.min(100, Math.round((currentSpent / hardLimit) * 100));

  const handleTopUp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selected, provider: "toss" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "충전 실패"); setLoading(false); return; }

      if (data.provider === "toss") {
        // TossPayments 결제 위젯 실행
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const toss = await loadTossPayments(data.clientKey);
        const payment = toss.payment({ customerKey: "ANONYMOUS" });
        await payment.requestPayment({
          method:    "CARD",
          amount:    { currency: "KRW", value: data.amount },
          orderId:   data.orderId,
          orderName: data.orderName,
          successUrl: data.successUrl,
          failUrl:    data.failUrl,
        });
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError((e as Error)?.message ?? "결제 오류");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>⚡ AI 크레딧 충전</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>한도 초과 — 더 사용하려면 충전하세요</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: T.muted, fontSize: 20,
            cursor: "pointer", padding: "4px 8px", borderRadius: 6,
          }}>✕</button>
        </div>

        {/* 현재 사용량 */}
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 10, padding: "12px 14px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}>
            <span>이번 달 사용</span>
            <span style={{ color: "#f97316", fontWeight: 600 }}>₩{currentSpent.toLocaleString()} / ₩{hardLimit.toLocaleString()}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${usedPct}%`, background: "linear-gradient(90deg,#f97316,#f43f5e)", borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
            다음 초기화: {periodReset} | 충전 즉시 적용
          </div>
        </div>

        {/* 충전 옵션 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {OPTIONS.map(opt => (
            <button
              key={opt.amount}
              onClick={() => setSelected(opt.amount)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                border: selected === opt.amount ? "2px solid #f97316" : `1px solid ${T.border}`,
                background: selected === opt.amount ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.02)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  border: selected === opt.amount ? "5px solid #f97316" : `2px solid ${T.muted}`,
                  transition: "all 0.15s",
                }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{opt.desc}</div>
                </div>
              </div>
              {opt.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                  background: opt.badge === "추천" ? "#f97316" : "#22c55e", color: "#fff",
                }}>{opt.badge}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            marginBottom: 12, padding: "8px 12px", borderRadius: 8,
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
            fontSize: 12, color: "#f87171",
          }}>⚠️ {error}</div>
        )}

        {/* 충전 버튼 */}
        <button
          onClick={handleTopUp}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
            background: loading ? "#374151" : "linear-gradient(135deg,#f97316,#f43f5e)",
            color: loading ? "#9ca3af" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 20px rgba(249,115,22,0.35)",
            transition: "all 0.15s",
          }}
        >
          {loading ? "결제 중..." : `₩${selected.toLocaleString()} 충전하기`}
        </button>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: T.muted }}>
          토스페이먼츠 / Stripe 안전결제 · 즉시 한도 반영
        </div>
      </div>
    </div>
  );
}
