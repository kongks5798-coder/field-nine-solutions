"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";

const T = {
  bg:      "#07080f",
  surface: "#0d1020",
  card:    "#111827",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#f97316",
  text:    "#e2e8f0",
  muted:   "#6b7280",
  green:   "#22c55e",
  red:     "#f87171",
  blue:    "#60a5fa",
  yellow:  "#fbbf24",
};

type Sub = {
  id: string;
  user_id: string;
  plan: string | null;
  status: string;
  provider: "toss" | "stripe" | "unknown";
  current_period_start: string | null;
  current_period_end:   string | null;
  toss_order_id: string | null;
  stripe_subscription_id: string | null;
  profiles: { email: string; full_name: string | null } | null;
};

const STATUS_COLOR: Record<string, string> = {
  active:    T.green,
  past_due:  T.yellow,
  canceled:  T.red,
  expired:   T.muted,
};

const STATUS_LABELS: Record<string, string> = {
  active:   "활성",
  past_due: "연체",
  canceled: "취소됨",
  expired:  "만료",
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? T.muted;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${c}22`, color: c }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: `1px solid ${T.border}`, color: T.muted }}>
      {provider === "toss" ? "토스" : provider === "stripe" ? "Stripe" : "?"}
    </span>
  );
}

export default function AdminSubscriptionsPage() {
  const [subs,     setSubs]     = useState<Sub[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [statusF,  setStatusF]  = useState("active");
  const [page,     setPage]     = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (statusF) params.set("status", statusF);
    try {
      const r = await fetch(`/api/admin/subscriptions?${params}`);
      if (!r.ok) { setError("로드 실패"); return; }
      const d = await r.json();
      setSubs(d.subscriptions ?? []);
      setTotal(d.total ?? 0);
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  }, [statusF, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>구독 관리</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>전체 {total.toLocaleString()}건</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={statusF}
            onChange={e => { setStatusF(e.target.value); setPage(0); }}
            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none" }}
          >
            <option value="">전체 상태</option>
            <option value="active">활성</option>
            <option value="past_due">연체</option>
            <option value="canceled">취소됨</option>
            <option value="expired">만료</option>
          </select>
          <button onClick={load} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, padding: 20 }}>{error}</div>
      ) : (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.2fr", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>사용자</span><span>플랜</span><span>결제사</span><span>상태</span><span>시작일</span><span>종료일</span>
            </div>
            {subs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>구독 없음</div>
            ) : subs.map(s => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.2fr", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", fontSize: 13 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.profiles?.email ?? s.user_id}</div>
                  {s.profiles?.full_name && <div style={{ fontSize: 11, color: T.muted }}>{s.profiles.full_name}</div>}
                </div>
                <div style={{ fontSize: 12, color: T.muted, textTransform: "capitalize" }}>{s.plan ?? "—"}</div>
                <div><ProviderBadge provider={s.provider} /></div>
                <div><StatusBadge status={s.status} /></div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {s.current_period_start ? new Date(s.current_period_start).toLocaleDateString("ko-KR") : "—"}
                </div>
                <div style={{ fontSize: 11, color: s.status === "active" ? T.text : T.muted }}>
                  {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("ko-KR") : "—"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: page === 0 ? T.muted : T.text, fontSize: 12, cursor: page === 0 ? "default" : "pointer" }}>
              이전
            </button>
            <span style={{ padding: "6px 12px", fontSize: 12, color: T.muted }}>
              {page + 1} / {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}
              style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: (page + 1) * limit >= total ? T.muted : T.text, fontSize: 12, cursor: (page + 1) * limit >= total ? "default" : "pointer" }}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
