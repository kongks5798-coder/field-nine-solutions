"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const paymentKey = searchParams?.get("paymentKey");
    const orderId    = searchParams?.get("orderId");
    const amount     = searchParams?.get("amount");
    const plan       = searchParams?.get("plan") ?? "pro";

    if (!paymentKey || !orderId || !amount) {
      // URL params missing — likely arrived here after server-side confirm redirect
      // Just show success and redirect
      setStatus("done");
      setMessage("결제가 완료되었습니다!");
      const t = setTimeout(() => router.push("/workspace"), 2000);
      return () => clearTimeout(t);
    }

    // Call confirm endpoint (client-side fallback)
    const url = new URL("/api/billing/toss/confirm", window.location.origin);
    url.searchParams.set("paymentKey", paymentKey);
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("amount", amount);
    url.searchParams.set("plan", plan);

    fetch(url.toString())
      .then(r => {
        if (r.ok || r.redirected) {
          setStatus("done");
          setMessage("결제가 완료되었습니다!");
          setTimeout(() => router.push("/workspace"), 2000);
        } else {
          setStatus("error");
          setMessage("결제 확인 중 오류가 발생했습니다.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("네트워크 오류가 발생했습니다.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const planLabel: Record<string, string> = {
    pro:  "Pro",
    team: "Team",
  };
  const plan = searchParams?.get("plan") ?? "pro";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: 24,
    }}>
      <div style={{
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "48px 40px",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
      }}>
        {status === "confirming" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20, animation: "spin 1.2s linear infinite" }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>
              결제 확인 중...
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              잠시만 기다려 주세요.
            </p>
          </>
        )}

        {status === "done" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#e2e8f0", marginBottom: 10 }}>
              결제 완료!
            </h1>
            <div style={{
              display: "inline-block",
              padding: "4px 16px",
              borderRadius: 20,
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.4)",
              fontSize: 13,
              fontWeight: 700,
              color: "#f97316",
              marginBottom: 16,
            }}>
              {planLabel[plan] ?? plan} 플랜 활성화
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 28 }}>
              {message}<br />
              2초 후 워크스페이스로 이동합니다.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => router.push("/workspace")}
                style={{
                  padding: "12px 28px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #f97316, #f43f5e)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                워크스페이스 바로가기 →
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>
              오류 발생
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 28 }}>
              {message}<br />
              고객센터: support@fieldnine.io
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => router.push("/pricing")}
                style={{
                  padding: "11px 22px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e2e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                요금제로 돌아가기
              </button>
              <button
                onClick={() => router.push("/billing")}
                style={{
                  padding: "11px 22px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #f97316, #f43f5e)",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                청구 페이지
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
