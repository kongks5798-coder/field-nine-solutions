"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

interface CancelPreview {
  remainDays: number;
  totalDays: number;
  baseRefund: number;
  overageAmount: number;
  refundAmount: number;
  plan: string;
  periodEnd: string;
}

const PLAN_PERKS: Record<string, string[]> = {
  pro: [
    "월 500,000 AI 토큰",
    "하루 500회 AI 호출",
    "고급 AI 모델 (Claude, GPT-4) 접근",
    "클라우드 스토리지 50GB",
    "우선 고객 지원",
  ],
  team: [
    "월 2,000,000 AI 토큰",
    "하루 999회 AI 호출",
    "모든 AI 모델 무제한 접근",
    "클라우드 스토리지 200GB",
    "팀원 협업 기능",
    "전담 고객 지원",
  ],
};

export default function BillingCancelPage() {
  const router = useRouter();

  const [preview, setPreview]     = useState<CancelPreview | null>(null);
  const [loading, setLoading]     = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [doneMsg, setDoneMsg]     = useState("");

  // Fetch cancel preview (refund calculation)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/billing/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preview: true }),
        });
        if (r.ok) {
          const d: CancelPreview = await r.json();
          setPreview(d);
        }
      } catch {
        // ignore — show generic UI
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCancel = async () => {
    setCanceling(true);
    setError("");
    try {
      const r = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: false }),
      });
      const d = await r.json();
      if (r.ok) {
        setDone(true);
        setDoneMsg(d.message ?? "구독이 취소되었습니다.");
        setTimeout(() => router.push("/billing"), 3000);
      } else {
        setError(d.error ?? "취소 중 오류가 발생했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setCanceling(false);
  };

  const perks = preview ? (PLAN_PERKS[preview.plan] ?? PLAN_PERKS.pro) : PLAN_PERKS.pro;

  return (
    <AppShell>
      <div style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#d4d8e2",
        fontFamily: "'Inter', 'Pretendard', sans-serif",
        padding: "48px 24px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 520 }}>

          {/* Success state */}
          {done ? (
            <div style={{
              textAlign: "center",
              padding: "48px 32px",
              background: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#d4d8e2" }}>
                구독이 취소되었습니다
              </h2>
              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>{doneMsg}</p>
              <p style={{ fontSize: 13, color: "#6b7280" }}>잠시 후 청구 페이지로 이동합니다...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 28, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😢</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#d4d8e2" }}>
                  정말 구독을 취소하시겠습니까?
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  구독을 취소하면 현재 기간 종료 후 스타터 플랜으로 전환됩니다.<br />
                  언제든지 다시 업그레이드할 수 있습니다.
                </p>
              </div>

              {/* What you lose */}
              <div style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 12 }}>
                  취소 시 사라지는 기능
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {perks.map((p, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#9ca3af" }}>
                      <span style={{ color: "#f87171", fontSize: 16, flexShrink: 0 }}>✗</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Refund preview */}
              {loading ? (
                <div style={{
                  background: "#0d1117", border: "1px solid #30363d",
                  borderRadius: 12, padding: "16px 24px", marginBottom: 16,
                  fontSize: 13, color: "#6b7280",
                }}>
                  환불 금액 계산 중...
                </div>
              ) : preview ? (
                <div style={{
                  background: "#0d1117",
                  border: `1px solid ${preview.refundAmount > 0 ? "rgba(34,197,94,0.3)" : "#30363d"}`,
                  borderRadius: 12,
                  padding: "20px 24px",
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#d4d8e2", marginBottom: 12 }}>환불 예상 금액</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#9ca3af" }}>기본 환불 ({preview.remainDays}일 남음)</span>
                      <span style={{ color: "#d4d8e2" }}>₩{preview.baseRefund.toLocaleString()}</span>
                    </div>
                    {preview.overageAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#9ca3af" }}>초과 사용 차감</span>
                        <span style={{ color: "#f87171" }}>-₩{preview.overageAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ height: 1, background: "#21262d", margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
                      <span style={{ color: "#d4d8e2" }}>최종 환불액</span>
                      <span style={{ color: preview.refundAmount > 0 ? "#22c55e" : "#6b7280" }}>
                        ₩{preview.refundAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {preview.refundAmount > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                      환불은 3~5 영업일 이내 원래 결제 수단으로 처리됩니다.
                    </div>
                  )}
                  {preview.refundAmount === 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                      구독은{" "}
                      {new Date(preview.periodEnd).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}{" "}
                      까지 유지됩니다.
                    </div>
                  )}
                </div>
              ) : null}

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: 16, padding: "10px 16px", borderRadius: 10,
                  background: "rgba(248,113,113,0.08)", color: "#f87171",
                  border: "1px solid rgba(248,113,113,0.2)", fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  style={{
                    padding: "12px 0", borderRadius: 10, border: "none",
                    background: canceling ? "#374151" : "#ef4444",
                    color: "#fff", fontSize: 15, fontWeight: 700,
                    cursor: canceling ? "default" : "pointer",
                    opacity: canceling ? 0.7 : 1,
                  }}
                >
                  {canceling ? "처리 중..." : "구독 취소 확인"}
                </button>
                <button
                  onClick={() => router.push("/billing")}
                  disabled={canceling}
                  style={{
                    padding: "12px 0", borderRadius: 10,
                    border: "1px solid #30363d", background: "transparent",
                    color: "#9ca3af", fontSize: 15, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  돌아가기
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: 12, color: "#4a5066", marginTop: 20 }}>
                계속 사용하고 싶으시다면{" "}
                <a href="/pricing" style={{ color: "#f97316", textDecoration: "none" }}>다른 플랜을 둘러보세요</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
