"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

interface MonthlyUsage {
  billing_period: string;
  ai_calls: number;
  amount_krw: number;
  status: string;
  stripe_invoice_id?: string;
}

interface BillingEvent {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface MeteredInfo {
  amount_krw: number;
  ai_calls: number;
  status: string;
  monthly_limit: number;
  warn_threshold: number;
  hard_limit: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open:     { label: "청구 예정",   color: "#fb923c" },
  invoiced: { label: "청구 완료",   color: "#60a5fa" },
  paid:     { label: "결제 완료",   color: "#22c55e" },
  failed:   { label: "결제 실패",   color: "#f87171" },
  skipped:  { label: "해당 없음",   color: "#6b7280" },
};

const EVENT_LABEL: Record<string, string> = {
  subscription_created:    "구독 시작",
  payment_succeeded:       "결제 성공",
  payment_failed:          "결제 실패",
  subscription_canceled:   "구독 취소",
  usage_invoiced:          "사용료 청구",
  usage_invoice_failed:    "사용료 청구 실패",
};

export default function BillingPage() {
  const router = useRouter();
  const [metered, setMetered]           = useState<MeteredInfo | null>(null);
  const [history, setHistory]           = useState<MonthlyUsage[]>([]);
  const [events, setEvents]             = useState<BillingEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [plan, setPlan]                 = useState<string>("starter");
  const [canceling, setCanceling]       = useState(false);
  const [cancelMsg, setCancelMsg]       = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/usage").then(r => r.ok ? r.json() : null),
      fetch("/api/billing/history").then(r => r.ok ? r.json() : null),
    ]).then(([usageData, historyData]) => {
      if (usageData) {
        setMetered(usageData.metered);
        setPlan(usageData.plan ?? "starter");
      }
      if (historyData) {
        setHistory(historyData.monthly ?? []);
        setEvents(historyData.events ?? []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCancelToss = async () => {
    if (!confirm("정말 구독을 취소하시겠습니까? 현재 기간 종료 후 무료 플랜으로 전환됩니다.")) return;
    setCanceling(true);
    setCancelMsg("");
    try {
      const r = await fetch("/api/payment/toss/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: "사용자 요청" }),
      });
      const d = await r.json();
      if (r.ok) { setCancelMsg(d.message || "구독이 취소되었습니다."); }
      else       { setCancelMsg(d.error  || "취소 중 오류가 발생했습니다."); }
    } catch {
      setCancelMsg("네트워크 오류가 발생했습니다.");
    }
    setCanceling(false);
  };

  const pct = metered
    ? Math.min(100, Math.round((metered.amount_krw / metered.hard_limit) * 100))
    : 0;
  const isWarn = metered ? metered.amount_krw >= metered.warn_threshold : false;
  const isMax  = metered ? metered.amount_krw >= metered.hard_limit : false;

  return (
    <AppShell>
      <div style={{
        minHeight: "100vh", background: "#050508",
        color: "#d4d8e2", fontFamily: "'Inter', sans-serif",
        padding: "32px 24px", maxWidth: 860, margin: "0 auto",
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>청구 & 사용량</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 32 }}>
          이번 달 AI 사용료 및 청구 내역을 확인하세요. 매월 1일에 자동 청구됩니다.
        </p>

        {loading ? (
          <p style={{ color: "#6b7280" }}>로딩 중...</p>
        ) : (
          <>
            {/* 현재 플랜 */}
            <div style={{
              background: "#0b0b14", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "20px 24px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>현재 플랜</div>
                <div style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize" }}>
                  {plan === "starter" ? "🆓 스타터" : plan === "pro" ? "⚡ Pro" : "🚀 Team"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {plan === "starter" ? (
                  <button onClick={() => router.push("/pricing")}
                    style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    업그레이드
                  </button>
                ) : (
                  <button onClick={handleCancelToss} disabled={canceling}
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: canceling ? "default" : "pointer", opacity: canceling ? 0.6 : 1 }}>
                    {canceling ? "처리 중..." : "구독 취소"}
                  </button>
                )}
              </div>
            </div>
            {cancelMsg && (
              <div style={{ marginBottom: 12, padding: "10px 16px", borderRadius: 8, background: cancelMsg.includes("취소") && !cancelMsg.includes("오류") ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)", color: cancelMsg.includes("오류") ? "#f87171" : "#22c55e", fontSize: 13, border: `1px solid ${cancelMsg.includes("오류") ? "rgba(248,113,113,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                {cancelMsg}
              </div>
            )}

            {/* 이번 달 사용량 (Pro/Team) */}
            {metered && plan !== "starter" && (
              <div style={{
                background: "#0b0b14", border: `1px solid ${isMax ? "#f87171" : isWarn ? "#fb923c" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "20px 24px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>이번 달 사용 요금</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: isMax ? "#f87171" : isWarn ? "#fb923c" : "#f97316" }}>
                    {metered.amount_krw.toLocaleString()}원
                  </span>
                  <span style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>
                    / {metered.hard_limit.toLocaleString()}원 한도
                  </span>
                </div>

                {/* 진행 바 */}
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 8, marginBottom: 12 }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 6,
                    background: isMax ? "#f87171" : isWarn ? "#fb923c" : "#f97316",
                    transition: "width 0.3s",
                  }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                  <span>AI 호출 {metered.ai_calls}회</span>
                  <span>{pct}% 사용</span>
                </div>

                {isMax && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8717118", borderRadius: 8, fontSize: 12, color: "#f87171" }}>
                    ⛔ 월 한도 도달 — 다음 달 1일에 초기화됩니다. 한도 증액은 설정에서 요청하세요.
                  </div>
                )}
                {isWarn && !isMax && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#fb923c18", borderRadius: 8, fontSize: 12, color: "#fb923c" }}>
                    ⚠️ 한도의 80%에 도달했습니다. 사용량을 확인해주세요.
                  </div>
                )}

                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12, color: "#6b7280" }}>
                  📅 <strong style={{ color: "#d4d8e2" }}>다음 청구일:</strong> 다음 달 1일 자동 청구 |
                  소비된 AI 서비스는 환불이 불가합니다 (<a href="/terms" style={{ color: "#f97316" }}>이용약관</a>)
                </div>
              </div>
            )}

            {/* 스타터: 일일 사용량 */}
            {plan === "starter" && (
              <div style={{
                background: "#0b0b14", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "20px 24px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>스타터 플랜 제한</div>
                <div style={{ fontSize: 15, color: "#d4d8e2" }}>
                  하루 <strong style={{ color: "#f97316" }}>10회</strong> AI 무료 사용 가능
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                  무제한 사용은 Pro/Team 플랜으로 업그레이드하세요.
                </div>
              </div>
            )}

            {/* 월별 청구 내역 */}
            {history.length > 0 && (
              <div style={{
                background: "#0b0b14", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "20px 24px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>월별 청구 내역</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 100px", gap: "8px 12px" }}>
                  {["청구 기간", "AI 호출", "금액", "상태"].map(h => (
                    <div key={h} style={{ fontSize: 11, color: "#4a5066", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
                  ))}
                  {history.map(row => {
                    const s = STATUS_LABEL[row.status] ?? { label: row.status, color: "#6b7280" };
                    return [
                      <div key={`p-${row.billing_period}`} style={{ fontSize: 13, padding: "8px 0" }}>{row.billing_period}</div>,
                      <div key={`c-${row.billing_period}`} style={{ fontSize: 13, padding: "8px 0" }}>{row.ai_calls}회</div>,
                      <div key={`a-${row.billing_period}`} style={{ fontSize: 13, padding: "8px 0", fontWeight: 600 }}>{row.amount_krw.toLocaleString()}원</div>,
                      <div key={`s-${row.billing_period}`} style={{ fontSize: 12, padding: "8px 0", color: s.color }}>{s.label}</div>,
                    ];
                  })}
                </div>
              </div>
            )}

            {/* 결제 이벤트 로그 */}
            {events.length > 0 && (
              <div style={{
                background: "#0b0b14", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>결제 이벤트 로그</div>
                {events.map(ev => (
                  <div key={ev.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    fontSize: 13,
                  }}>
                    <div>
                      <span style={{ color: "#d4d8e2", fontWeight: 500 }}>
                        {EVENT_LABEL[ev.type] ?? ev.type}
                      </span>
                      <span style={{ color: "#6b7280", marginLeft: 10, fontSize: 12 }}>{ev.description}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {ev.amount > 0 && (
                        <div style={{ fontWeight: 700, color: "#f97316" }}>{ev.amount.toLocaleString()}원</div>
                      )}
                      <div style={{ fontSize: 11, color: "#4a5066" }}>
                        {new Date(ev.created_at).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {history.length === 0 && events.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#4a5066" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14 }}>아직 청구 내역이 없습니다</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>AI를 사용하면 이곳에 기록됩니다</div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
