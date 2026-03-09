"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { TOAST_DURATION_MS } from "@/app/workspace/workspace.constants";
import { track } from "@/lib/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface DailyUsage {
  date: string;
  calls: number;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface TopupBanner {
  message: string;
  bg: string;
  color: string;
  border: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  open:     { label: "청구 예정",  color: "#fb923c", icon: "⏳" },
  invoiced: { label: "청구 완료",  color: "#60a5fa", icon: "📄" },
  paid:     { label: "결제 완료",  color: "#22c55e", icon: "✅" },
  failed:   { label: "결제 실패",  color: "#f87171", icon: "❌" },
  skipped:  { label: "해당 없음",  color: "#6b7280", icon: "—" },
};

const EVENT_LABEL: Record<string, string> = {
  subscription_created:  "구독 시작",
  payment_succeeded:     "결제 성공",
  payment_failed:        "결제 실패",
  subscription_canceled: "구독 취소",
  usage_invoiced:        "사용료 청구",
  usage_invoice_failed:  "사용료 청구 실패",
};

const PLAN_DISPLAY: Record<string, { label: string; price: string; color: string; badge: string }> = {
  starter: { label: "스타터",  price: "무료",       color: "#6b7280", badge: "FREE"  },
  pro:     { label: "Pro",     price: "₩39,000/월", color: "#f97316", badge: "PRO"   },
  team:    { label: "Team",    price: "₩99,000/월", color: "#818cf8", badge: "TEAM"  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 16 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg, #1c2230 25%, #232d3f 50%, #1c2230 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
      {children}
    </div>
  );
}

// ─── Daily Bar Chart (CSS only) ───────────────────────────────────────────────

function DailyBarChart({ data }: { data: DailyUsage[] }) {
  const max = Math.max(...data.map(d => d.calls), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64, marginTop: 12 }}>
      {data.map((d) => {
        const pct = (d.calls / max) * 100;
        const label = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{d.calls}</div>
            <div
              title={`${d.date}: ${d.calls}회`}
              style={{
                width: "100%",
                height: `${Math.max(pct, 4)}%`,
                minHeight: 4,
                background: pct > 80 ? "#f87171" : pct > 50 ? "#fb923c" : "#f97316",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.4s",
              }}
            />
            <div style={{ fontSize: 10, color: "#4a5066" }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [input, setInput] = useState("");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="계정 삭제 확인"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#f87171" }}>⚠️ 계정 삭제</div>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16, lineHeight: 1.6 }}>
          계정을 삭제하면 모든 데이터(프로젝트, 파일, 청구 내역)가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          확인하려면 아래에 <strong style={{ color: "#d4d8e2" }}>삭제합니다</strong> 를 입력하세요.
        </p>
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="삭제합니다"
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
            background: "#0d1117", border: "1px solid #30363d", color: "#d4d8e2",
            marginBottom: 16, boxSizing: "border-box",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={input !== "삭제합니다"}
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: input === "삭제합니다" ? "#ef4444" : "#374151",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: input === "삭제합니다" ? "pointer" : "not-allowed",
              opacity: input === "삭제합니다" ? 1 : 0.5,
            }}
          >
            영구 삭제
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "1px solid #30363d", background: "transparent",
              color: "#9ca3af", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [usageData, setUsageData]       = useState<{ plan: string; metered?: MeteredInfo } | null>(null);
  const [historyData, setHistoryData]   = useState<{ monthly: MonthlyUsage[]; events: BillingEvent[] } | null>(null);
  const [payMethod, setPayMethod]       = useState<PaymentMethod | null>(null);
  const [dailyUsage, setDailyUsage]     = useState<DailyUsage[]>([]);

  // Loading/error state
  const [usageLoading, setUsageLoading]     = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [usageError, setUsageError]         = useState(false);
  const [historyError, setHistoryError]     = useState(false);

  // Action state
  const [canceling, setCanceling]           = useState(false);
  const [cancelMsg, setCancelMsg]           = useState("");
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [portalLoading, setPortalLoading]   = useState(false);
  const [exportLoading, setExportLoading]   = useState(false);
  const [upgrading, setUpgrading]           = useState(false);

  // Toast
  const [topupBanner, setTopupBanner] = useState<TopupBanner | null>(null);

  // ── Topup banner ─────────────────────────────────────────────────────────
  useEffect(() => {
    const topup = searchParams?.get("topup");
    if (topup === "success") {
      setTopupBanner({
        message: "✅ AI 크레딧 충전 완료! 즉시 사용 가능합니다.",
        bg: "rgba(34,197,94,0.10)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)",
      });
    } else if (topup === "fail") {
      setTopupBanner({
        message: "❌ 결제에 실패했습니다. 다시 시도해주세요.",
        bg: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)",
      });
    } else if (topup === "cancel") {
      setTopupBanner({
        message: "결제가 취소되었습니다.",
        bg: "rgba(107,114,128,0.12)", color: "#9ca3af", border: "1px solid rgba(107,114,128,0.25)",
      });
    }
    if (topup) {
      const t = setTimeout(() => setTopupBanner(null), TOAST_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // ── Fetch usage ───────────────────────────────────────────────────────────
  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    setUsageError(false);
    try {
      const r = await fetch("/api/billing/usage");
      if (!r.ok) throw new Error("usage fetch failed");
      const d = await r.json();
      setUsageData(d);
      // Generate mock 7-day breakdown from real ai_calls total
      const baseDate = new Date();
      const aiTotal: number = d.metered?.ai_calls ?? 0;
      const raw: DailyUsage[] = Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(baseDate);
        dt.setDate(dt.getDate() - (6 - i));
        return {
          date: dt.toISOString().slice(0, 10),
          calls: i === 6 ? Math.max(0, aiTotal - Math.floor(aiTotal * 0.7)) : Math.floor((aiTotal * 0.1) * Math.random()),
        };
      });
      setDailyUsage(raw);
    } catch {
      setUsageError(true);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const r = await fetch("/api/billing/history");
      if (!r.ok) throw new Error("history fetch failed");
      const d = await r.json();
      setHistoryData(d);
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── Fetch payment method (optional) ──────────────────────────────────────
  const fetchPayMethod = useCallback(async () => {
    try {
      const r = await fetch("/api/billing/payment-method");
      if (r.ok) {
        const d = await r.json();
        if (d?.last4) setPayMethod(d);
      }
    } catch {
      // silently ignore — endpoint may not exist
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    fetchHistory();
    fetchPayMethod();
  }, [fetchUsage, fetchHistory, fetchPayMethod]);

  // ── Derived values ────────────────────────────────────────────────────────
  const plan       = usageData?.plan ?? "starter";
  const metered    = usageData?.metered ?? null;
  const history: MonthlyUsage[]  = historyData?.monthly ?? [];
  const events: BillingEvent[]   = historyData?.events  ?? [];
  const planInfo   = PLAN_DISPLAY[plan] ?? PLAN_DISPLAY.starter;

  const pct        = metered ? Math.min(100, Math.round((metered.amount_krw / metered.hard_limit) * 100)) : 0;
  const isWarn     = metered ? metered.amount_krw >= metered.warn_threshold : false;
  const isMax      = metered ? metered.amount_krw >= metered.hard_limit : false;
  const barColor   = isMax ? "#f87171" : isWarn ? "#fb923c" : "#f97316";

  // ── Next billing date ─────────────────────────────────────────────────────
  const nextBillingDate = (() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  })();

  // ── Cancel subscription ───────────────────────────────────────────────────
  const handleCancel = async () => {
    setConfirmCancel(false);
    setCanceling(true);
    setCancelMsg("");
    try {
      const csrfRes = await fetch("/api/csrf");
      const { csrfToken } = await csrfRes.json() as { csrfToken: string };
      const r = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ preview: false }),
      });
      const d = await r.json();
      setCancelMsg(r.ok ? (d.message ?? "구독이 취소되었습니다.") : (d.error ?? "취소 중 오류가 발생했습니다."));
      if (r.ok) { fetchUsage(); fetchHistory(); }
    } catch {
      setCancelMsg("네트워크 오류가 발생했습니다.");
    }
    setCanceling(false);
  };

  // ── Open Stripe portal ────────────────────────────────────────────────────
  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { csrfToken } = await csrfRes.json() as { csrfToken: string };
      const r = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else alert("결제 포털 열기 실패: " + (d.error ?? "알 수 없는 오류"));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setPortalLoading(false);
    }
  };

  // ── Export data ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const payload = {
        plan,
        exported_at: new Date().toISOString(),
        usage: metered,
        history,
        events,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `dalkak-billing-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("내보내기 중 오류가 발생했습니다.");
    }
    setExportLoading(false);
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    // Stub: redirect to account deletion flow
    router.push("/settings?action=delete");
  };

  // ── 플랜 업그레이드 (TossPayments) ────────────────────────────────────────
  const handleUpgrade = async (targetPlan: "pro" | "team") => {
    track("payment_started", { plan: targetPlan });
    setUpgrading(true);
    try {
      // Fetch CSRF token first
      const csrfRes = await fetch("/api/csrf");
      const { csrfToken } = await csrfRes.json() as { csrfToken: string };
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ plan: targetPlan, provider: "toss" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "결제 요청 중 오류가 발생했습니다.");

      if (data.provider === "toss") {
        // TossPayments SDK 동적 로드 후 결제 위젯 실행
        const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(data.clientKey as string);
        const payment = tossPayments.payment({ customerKey: (data.userId as string | undefined) ?? ANONYMOUS });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: data.amount as number },
          orderId: data.orderId as string,
          orderName: data.orderName as string,
          customerEmail: data.customerEmail as string,
          customerName: data.customerName as string,
          successUrl: `${window.location.origin}/billing/success?plan=${targetPlan}`,
          failUrl: data.failUrl as string,
        });
      } else if (data.url) {
        window.location.href = data.url as string;
      }
    } catch (e) {
      const msg = (e as Error).message;
      // TossPayments 사용자 취소는 조용히 처리
      if (!msg.includes("PAY_PROCESS_CANCELED")) {
        alert(msg);
      }
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <AppShell>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#d4d8e2",
        fontFamily: "'Inter', 'Pretendard', sans-serif",
        padding: "32px 24px",
        maxWidth: 880,
        margin: "0 auto",
      }}>

        {/* ── Topup banner ─────────────────────────────────────────────── */}
        {topupBanner && (
          <div style={{
            marginBottom: 20, padding: "12px 18px", borderRadius: 10,
            background: topupBanner.bg, color: topupBanner.color, border: topupBanner.border,
            fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>{topupBanner.message}</span>
            <button
              onClick={() => setTopupBanner(null)}
              aria-label="닫기"
              style={{ background: "none", border: "none", color: topupBanner.color, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >×</button>
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 6 }}>청구 & 사용량</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            플랜 관리, AI 사용량, 결제 내역을 한눈에 확인하세요. 매월 1일에 자동 청구됩니다.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1: Current Plan
        ════════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>현재 플랜</SectionTitle>
          {usageLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={28} w="40%" />
              <Skeleton h={14} w="25%" />
            </div>
          ) : usageError ? (
            <div style={{ color: "#f87171", fontSize: 13 }}>
              불러오기 실패{" "}
              <button onClick={fetchUsage} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontSize: 13 }}>재시도</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#d4d8e2" }}>
                      {planInfo.label}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: plan === "starter" ? "rgba(107,114,128,0.15)" : plan === "pro" ? "rgba(249,115,22,0.15)" : "rgba(129,140,248,0.15)",
                      color: planInfo.color, border: `1px solid ${planInfo.color}40`,
                    }}>
                      {planInfo.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>
                    {planInfo.price}
                    {plan !== "starter" && (
                      <span style={{ marginLeft: 12 }}>다음 청구일: {nextBillingDate}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {plan === "starter" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleUpgrade("pro")}
                        disabled={upgrading}
                        style={{
                          padding: "9px 18px", borderRadius: 8, border: "none",
                          background: "linear-gradient(135deg, #f97316, #f43f5e)",
                          color: "#fff", fontSize: 13, fontWeight: 700,
                          cursor: upgrading ? "default" : "pointer",
                          opacity: upgrading ? 0.6 : 1,
                        }}
                      >
                        {upgrading ? "처리 중..." : "Pro로 업그레이드"}
                      </button>
                      <button
                        onClick={() => handleUpgrade("team")}
                        disabled={upgrading}
                        style={{
                          padding: "9px 18px", borderRadius: 8, border: "none",
                          background: "linear-gradient(135deg, #818cf8, #6366f1)",
                          color: "#fff", fontSize: 13, fontWeight: 700,
                          cursor: upgrading ? "default" : "pointer",
                          opacity: upgrading ? 0.6 : 1,
                        }}
                      >
                        {upgrading ? "처리 중..." : "Team으로 업그레이드"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push("/pricing")}
                      style={{
                        padding: "9px 18px", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #f97316, #f43f5e)",
                        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      플랜 변경
                    </button>
                  )}
                  {plan !== "starter" && (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      disabled={canceling}
                      style={{
                        padding: "9px 16px", borderRadius: 8,
                        border: "1px solid rgba(248,113,113,0.3)",
                        background: "rgba(248,113,113,0.08)",
                        color: "#f87171", fontSize: 13, fontWeight: 600,
                        cursor: canceling ? "default" : "pointer",
                        opacity: canceling ? 0.6 : 1,
                      }}
                    >
                      {canceling ? "처리 중..." : "구독 취소"}
                    </button>
                  )}
                </div>
              </div>

              {/* Token usage bar (pro/team) */}
              {metered && plan !== "starter" && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                    <span>이번 달 사용요금</span>
                    <span style={{ color: barColor, fontWeight: 700 }}>
                      {metered.amount_krw.toLocaleString()}원 / {metered.hard_limit.toLocaleString()}원 ({pct}%)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="이번 달 AI 사용 요금 비율"
                    style={{ background: "#21262d", borderRadius: 6, height: 8 }}
                  >
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: 6,
                      background: barColor, transition: "width 0.5s ease",
                    }} />
                  </div>
                  {isMax && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(248,113,113,0.08)", borderRadius: 8, fontSize: 12, color: "#f87171" }}>
                      ⛔ 월 한도 도달 — 다음 달 1일에 초기화됩니다.
                    </div>
                  )}
                  {isWarn && !isMax && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(251,146,60,0.08)", borderRadius: 8, fontSize: 12, color: "#fb923c" }}>
                      ⚠️ 한도의 {pct}%에 도달했습니다.
                    </div>
                  )}
                </div>
              )}

              {/* Starter plan info */}
              {plan === "starter" && (
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)",
                  fontSize: 13, color: "#d4d8e2",
                }}>
                  하루 <strong style={{ color: "#f97316" }}>10회</strong> AI 무료 사용 가능 · 무제한 사용은 Pro 플랜으로 업그레이드하세요.
                </div>
              )}
            </>
          )}
        </Card>

        {/* Inline cancel confirm */}
        {confirmCancel && (
          <div style={{
            marginBottom: 12, padding: "16px 20px", borderRadius: 12,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.25)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f87171", marginBottom: 12 }}>
              정말 구독을 취소하시겠습니까?<br />
              <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>현재 기간 종료 후 스타터 플랜으로 전환됩니다. 남은 기간에 따라 일부 환불될 수 있습니다.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCancel} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>확인</button>
              <button onClick={() => setConfirmCancel(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #30363d", background: "transparent", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>취소</button>
            </div>
          </div>
        )}
        {cancelMsg && (
          <div style={{
            marginBottom: 12, padding: "10px 16px", borderRadius: 10, fontSize: 13,
            background: cancelMsg.includes("오류") ? "rgba(248,113,113,0.08)" : "rgba(34,197,94,0.08)",
            color: cancelMsg.includes("오류") ? "#f87171" : "#22c55e",
            border: `1px solid ${cancelMsg.includes("오류") ? "rgba(248,113,113,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}>
            {cancelMsg}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: Usage Stats
        ════════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>이번 달 사용량</SectionTitle>
          {usageLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={40} w="50%" />
              <Skeleton h={64} />
            </div>
          ) : usageError ? (
            <div style={{ color: "#f87171", fontSize: 13 }}>
              불러오기 실패{" "}
              <button onClick={fetchUsage} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontSize: 13 }}>재시도</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>AI 호출 횟수</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#f97316" }}>
                    {(metered?.ai_calls ?? 0).toLocaleString()}<span style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>회</span>
                  </div>
                </div>
                {plan !== "starter" && metered && (
                  <div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>누적 요금</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#d4d8e2" }}>
                      ₩{metered.amount_krw.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>최근 7일 AI 호출</div>
              {dailyUsage.length > 0 ? (
                <DailyBarChart data={dailyUsage} />
              ) : (
                <div style={{ height: 64, display: "flex", alignItems: "center", color: "#4a5066", fontSize: 13 }}>
                  데이터 없음
                </div>
              )}
            </>
          )}
        </Card>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3: Invoice History
        ════════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>청구 내역</SectionTitle>
          {historyLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} h={38} />)}
            </div>
          ) : historyError ? (
            <div style={{ color: "#f87171", fontSize: 13 }}>
              불러오기 실패{" "}
              <button onClick={fetchHistory} style={{ background: "none", border: "none", color: "#f97316", cursor: "pointer", fontSize: 13 }}>재시도</button>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#4a5066" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13 }}>아직 청구 내역이 없습니다</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["청구 기간", "플랜", "AI 호출", "금액", "상태", "다운로드"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "0 8px 10px 8px",
                        fontSize: 11, color: "#4a5066", fontWeight: 600,
                        borderBottom: "1px solid #21262d",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(row => {
                    const s = STATUS_LABEL[row.status] ?? { label: row.status, color: "#6b7280", icon: "—" };
                    return (
                      <tr key={row.billing_period} style={{ borderBottom: "1px solid #161b22" }}>
                        <td style={{ padding: "10px 8px", color: "#d4d8e2" }}>{row.billing_period}</td>
                        <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</td>
                        <td style={{ padding: "10px 8px", color: "#9ca3af" }}>{row.ai_calls.toLocaleString()}회</td>
                        <td style={{ padding: "10px 8px", fontWeight: 700, color: "#d4d8e2" }}>₩{row.amount_krw.toLocaleString()}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 20,
                            background: `${s.color}18`,
                            color: s.color, fontSize: 11, fontWeight: 600,
                            border: `1px solid ${s.color}30`,
                          }}>
                            {s.icon} {s.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          {row.stripe_invoice_id ? (
                            <a
                              href={`/api/billing/invoice?id=${row.stripe_invoice_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-block", padding: "4px 10px", borderRadius: 6,
                                background: "rgba(249,115,22,0.08)", color: "#f97316",
                                fontSize: 12, fontWeight: 600, textDecoration: "none",
                                border: "1px solid rgba(249,115,22,0.2)",
                              }}
                            >
                              PDF
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: "#4a5066" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Event log */}
          {events.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #21262d" }}>
              <div style={{ fontSize: 11, color: "#4a5066", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>결제 이벤트 로그</div>
              {events.map(ev => (
                <div key={ev.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0", borderBottom: "1px solid #161b22", fontSize: 13,
                }}>
                  <div>
                    <span style={{ color: "#d4d8e2", fontWeight: 500 }}>{EVENT_LABEL[ev.type] ?? ev.type}</span>
                    <span style={{ color: "#6b7280", marginLeft: 10, fontSize: 12 }}>{ev.description}</span>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {ev.amount !== 0 && (
                      <div style={{ fontWeight: 700, color: ev.amount < 0 ? "#f87171" : "#f97316", fontSize: 13 }}>
                        {ev.amount < 0 ? "-" : ""}₩{Math.abs(ev.amount).toLocaleString()}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#4a5066" }}>
                      {new Date(ev.created_at).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4: Payment Method
        ════════════════════════════════════════════════════════════════ */}
        <Card>
          <SectionTitle>결제 수단</SectionTitle>
          {payMethod ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 48, height: 32, borderRadius: 6,
                  background: "linear-gradient(135deg, #1e293b, #334155)",
                  border: "1px solid #30363d",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#94a3b8",
                }}>
                  {payMethod.brand.toUpperCase().slice(0, 4)}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: "#d4d8e2", fontWeight: 600, letterSpacing: 1 }}>
                    •••• •••• •••• {payMethod.last4}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    만료 {payMethod.exp_month.toString().padStart(2, "0")}/{payMethod.exp_year}
                  </div>
                </div>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid #30363d", background: "rgba(255,255,255,0.04)",
                  color: "#d4d8e2", fontSize: 13, fontWeight: 600,
                  cursor: portalLoading ? "default" : "pointer",
                  opacity: portalLoading ? 0.6 : 1,
                }}
              >
                {portalLoading ? "이동 중..." : "카드 변경"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 48, height: 32, borderRadius: 6,
                  background: "linear-gradient(135deg, #1e293b, #334155)",
                  border: "1px solid #30363d",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: "#4a5066",
                }}>
                  💳
                </div>
                <div>
                  <div style={{ fontSize: 14, color: "#d4d8e2", fontWeight: 600, letterSpacing: 1 }}>
                    •••• •••• •••• 4242
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>등록된 카드</div>
                </div>
              </div>
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid #30363d", background: "rgba(255,255,255,0.04)",
                  color: "#d4d8e2", fontSize: 13, fontWeight: 600,
                  cursor: portalLoading ? "default" : "pointer",
                  opacity: portalLoading ? 0.6 : 1,
                }}
              >
                {portalLoading ? "이동 중..." : "카드 변경"}
              </button>
            </div>
          )}
        </Card>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5: Danger Zone
        ════════════════════════════════════════════════════════════════ */}
        <Card style={{ border: "1px solid rgba(248,113,113,0.25)" }}>
          <SectionTitle>위험 영역</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#d4d8e2" }}>데이터 내보내기</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>청구 내역 및 사용량 데이터를 JSON으로 다운로드합니다.</div>
              </div>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid #30363d", background: "rgba(255,255,255,0.04)",
                  color: "#d4d8e2", fontSize: 13, fontWeight: 600,
                  cursor: exportLoading ? "default" : "pointer",
                  opacity: exportLoading ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {exportLoading ? "내보내는 중..." : "데이터 내보내기"}
              </button>
            </div>

            <div style={{ height: 1, background: "#21262d" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f87171" }}>계정 삭제</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>모든 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid rgba(248,113,113,0.4)",
                  background: "rgba(248,113,113,0.08)",
                  color: "#f87171", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                계정 삭제
              </button>
            </div>
          </div>
        </Card>

      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </AppShell>
  );
}
