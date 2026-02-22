"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  yellow:  "#fbbf24",
  blue:    "#60a5fa",
};

type Overview = {
  users:        { total: number; paid: number; free: number; pro: number; team: number };
  revenue:      { mrr: number; lastMrr: number; mrrGrowth: number };
  activeSubs:   number;
  recentEvents: Array<{ id: string; type: string; amount: number; description: string; created_at: string; profiles: { email: string } | null }>;
  systemStatus: Record<string, boolean>;
};

const EVENT_COLORS: Record<string, string> = {
  payment_succeeded:    T.green,
  subscription_created: T.blue,
  subscription_canceled: T.red,
  subscription_expired: T.yellow,
  payment_failed:       T.red,
  refund_issued:        T.yellow,
};

const EVENT_ICONS: Record<string, string> = {
  payment_succeeded:    "✓",
  subscription_created: "+",
  subscription_canceled: "×",
  subscription_expired: "⏰",
  payment_failed:       "!",
  refund_issued:        "↩",
};

function StatusDot({ ok }: { ok: boolean }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: ok ? T.green : T.red, display: "inline-block", marginRight: 6 }} />;
}

function KpiCard({ title, value, sub, color }: { title: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color ?? T.text, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data,    setData]    = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/overview");
      if (!r.ok) { setError("데이터 로드 실패"); return; }
      setData(await r.json());
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>대시보드 개요</h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>실시간 KPI · 최근 이벤트 · 시스템 상태</p>
        </div>
        <button onClick={load} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 16px", fontSize: 13, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
          새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, fontSize: 14, padding: 20 }}>{error}</div>
      ) : data ? (
        <>
          {/* KPI 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <KpiCard title="전체 유저" value={data.users.total.toLocaleString()} sub={`유료: ${data.users.paid}명`} />
            <KpiCard title="이번달 MRR" value={`₩${data.revenue.mrr.toLocaleString()}`}
              sub={`전월 대비 ${data.revenue.mrrGrowth >= 0 ? "+" : ""}${data.revenue.mrrGrowth}%`}
              color={data.revenue.mrrGrowth >= 0 ? T.green : T.red} />
            <KpiCard title="활성 구독" value={data.activeSubs} sub="Stripe + Toss 합산" color={T.blue} />
            <KpiCard title="전환율" value={`${data.users.total > 0 ? Math.round((data.users.paid / data.users.total) * 100) : 0}%`}
              sub={`프로 ${data.users.pro} · 팀 ${data.users.team}`} color={T.accent} />
          </div>

          {/* 플랜 분포 + 최근 이벤트 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 16, marginBottom: 24 }}>
            {/* 플랜 분포 */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>플랜 분포</div>
              {[
                { label: "무료", count: data.users.free, color: T.muted },
                { label: "프로", count: data.users.pro,  color: T.accent },
                { label: "팀",   count: data.users.team, color: T.blue },
              ].map(({ label, count, color }) => {
                const pct = data.users.total > 0 ? Math.round((count / data.users.total) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color }}>{label}</span>
                      <span style={{ color: T.muted }}>{count}명 ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: 6, borderRadius: 4, background: color, width: `${pct}%`, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 최근 billing_events */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>최근 결제 이벤트</div>
                <Link href="/admin/billing" style={{ fontSize: 12, color: T.accent, textDecoration: "none" }}>전체 보기 →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.recentEvents.length === 0 ? (
                  <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 20 }}>이벤트 없음</div>
                ) : data.recentEvents.map(ev => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${EVENT_COLORS[ev.type] ?? T.muted}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: EVENT_COLORS[ev.type] ?? T.muted, fontWeight: 900, flexShrink: 0 }}>
                      {EVENT_ICONS[ev.type] ?? "·"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: T.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.description}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{ev.profiles?.email ?? "—"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {ev.amount > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>+₩{ev.amount.toLocaleString()}</div>}
                      <div style={{ fontSize: 10, color: T.muted }}>{new Date(ev.created_at).toLocaleDateString("ko-KR")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 시스템 상태 */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>시스템 상태</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {Object.entries(data.systemStatus).map(([key, ok]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", fontSize: 12, padding: "7px 10px", background: ok ? "rgba(34,197,94,0.06)" : "rgba(248,113,113,0.06)", borderRadius: 8, border: `1px solid ${ok ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.15)"}` }}>
                  <StatusDot ok={ok} />
                  <span style={{ color: ok ? T.text : T.red, fontWeight: ok ? 500 : 700, textTransform: "capitalize" }}>{key}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
