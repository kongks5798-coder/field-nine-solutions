"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";

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

type MigStatus = { id: string; label: string; applied: boolean };
type MigInfo   = { dbUrlConfigured: boolean; projectRef: string; migrations: MigStatus[]; allApplied: boolean; hint?: string };
type MigResult = { id: string; label: string; status: "ok" | "skip" | "error"; message?: string };

export default function AdminOverviewPage() {
  const [data,       setData]       = useState<Overview | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [migInfo,    setMigInfo]    = useState<MigInfo | null>(null);
  const [migRunning, setMigRunning] = useState(false);
  const [migResults, setMigResults] = useState<MigResult[] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/overview");
      if (!r.ok) { setError("데이터 로드 실패"); return; }
      setData(await r.json());
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  };

  const loadMigInfo = async () => {
    try {
      const r = await fetch("/api/admin/db-migrate");
      if (r.ok) setMigInfo(await r.json());
    } catch { /* silent */ }
  };

  const runMigrations = async () => {
    setMigRunning(true);
    setMigResults(null);
    try {
      const r = await fetch("/api/admin/db-migrate", { method: "POST" });
      const d = await r.json();
      setMigResults(d.results ?? [{ id: "err", label: "실패", status: "error", message: d.message }]);
      await loadMigInfo();
    } catch (e: unknown) {
      setMigResults([{ id: "err", label: "네트워크 오류", status: "error", message: String(e) }]);
    } finally {
      setMigRunning(false);
    }
  };

  useEffect(() => { load(); loadMigInfo(); }, []);

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
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
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

          {/* DB 스키마 마이그레이션 */}
          {migInfo && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>DB 스키마 마이그레이션</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: migInfo.allApplied ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)", color: migInfo.allApplied ? T.green : T.yellow, fontWeight: 700 }}>
                    {migInfo.allApplied ? "✓ 최신" : "⚠ 미적용"}
                  </span>
                  {migInfo.dbUrlConfigured && !migInfo.allApplied && (
                    <button onClick={runMigrations} disabled={migRunning} style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 8, padding: "5px 14px", fontSize: 12, color: T.accent, cursor: migRunning ? "wait" : "pointer", fontWeight: 700 }}>
                      {migRunning ? "실행 중..." : "▶ 마이그레이션 실행"}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {migInfo.migrations.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: m.applied ? "rgba(34,197,94,0.04)" : "rgba(251,191,36,0.04)", borderRadius: 8, border: `1px solid ${m.applied ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.12)"}` }}>
                    <span style={{ fontSize: 13, color: m.applied ? T.green : T.yellow }}>{m.applied ? "✓" : "○"}</span>
                    <span style={{ fontSize: 12, color: T.text }}>{m.id} — {m.label}</span>
                  </div>
                ))}
              </div>
              {!migInfo.dbUrlConfigured && (
                <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(251,191,36,0.06)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.15)" }}>
                  <div style={{ fontSize: 12, color: T.yellow, fontWeight: 700, marginBottom: 6 }}>SUPABASE_DATABASE_URL 미설정</div>
                  <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
                    Vercel 대시보드 → Settings → Environment Variables 에서<br />
                    <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, color: T.text }}>SUPABASE_DATABASE_URL</code>
                    의 <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, color: T.accent }}>[DB_PASSWORD]</code>를
                    Supabase → Settings → Database → Connection String 비밀번호로 교체하면<br />
                    다음 배포 시 자동 마이그레이션이 실행됩니다.
                  </div>
                </div>
              )}
              {migResults && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                  {migResults.map(r => (
                    <div key={r.id} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, background: r.status === "ok" ? "rgba(34,197,94,0.08)" : r.status === "skip" ? "rgba(96,165,250,0.08)" : "rgba(248,113,113,0.08)", color: r.status === "ok" ? T.green : r.status === "skip" ? T.blue : T.red }}>
                      {r.status === "ok" ? "✓" : r.status === "skip" ? "↷" : "✗"} {r.label}{r.message ? ` — ${r.message}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
