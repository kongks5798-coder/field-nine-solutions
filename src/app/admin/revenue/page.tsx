"use client";

import { useEffect, useState } from "react";

interface RevenueData {
  users: { total: number; pro: number; team: number; free: number };
  revenue: { thisMonth: number; lastMonth: number; outstanding: number; failedCount: number };
  recentEvents: { type: string; amount: number; description: string; created_at: string }[];
}

const EVENT_LABEL: Record<string, string> = {
  subscription_created:  "구독 시작",
  payment_succeeded:     "결제 성공",
  payment_failed:        "결제 실패",
  subscription_canceled: "구독 취소",
  usage_invoiced:        "사용료 청구",
  usage_invoice_failed:  "사용료 실패",
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");

  const load = async (s: string) => {
    const res = await fetch("/api/admin/revenue", { headers: { "x-admin-secret": s } });
    if (!res.ok) { setErr("인증 실패"); return; }
    setData(await res.json());
    setAuthed(true);
  };

  const T = {
    bg: "#050508", panel: "#0b0b14", border: "rgba(255,255,255,0.07)",
    text: "#d4d8e2", muted: "#6b7280", accent: "#f97316",
    green: "#22c55e", red: "#f87171",
  };

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "32px 40px", width: 360 }}>
        <h2 style={{ color: T.text, marginBottom: 20, fontFamily: "sans-serif" }}>관리자 인증</h2>
        <input
          type="password" placeholder="ADMIN_SECRET"
          value={secret} onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(secret)}
          style={{ width: "100%", padding: "10px 14px", background: "#0f0f1a", border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
        {err && <p style={{ color: T.red, fontSize: 12, marginTop: 8 }}>{err}</p>}
        <button onClick={() => load(secret)}
          style={{ width: "100%", marginTop: 12, padding: "10px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}>
          로그인
        </button>
      </div>
    </div>
  );

  if (!data) return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontFamily: "sans-serif" }}>로딩 중...</div>;

  const growth = data.revenue.lastMonth > 0
    ? Math.round(((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", padding: "32px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>수익 대시보드</h1>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>Dalkak 운영 현황</p>
        </div>
        <button onClick={() => load(secret)} style={{ padding: "8px 16px", background: "#1f2937", border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          새로고침
        </button>
      </div>

      {/* 수익 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "이번달 예상 수익", value: `${data.revenue.thisMonth.toLocaleString()}원`, sub: growth !== 0 ? `전월 대비 ${growth > 0 ? "+" : ""}${growth}%` : "전월 데이터 없음", color: T.accent },
          { label: "전월 수익", value: `${data.revenue.lastMonth.toLocaleString()}원`, sub: "지난달 청구 완료", color: T.green },
          { label: "미수금", value: `${data.revenue.outstanding.toLocaleString()}원`, sub: `${data.revenue.failedCount}건 결제 실패`, color: data.revenue.outstanding > 0 ? T.red : T.muted },
          { label: "전체 사용자", value: data.users.total.toLocaleString(), sub: `Pro ${data.users.pro} · Team ${data.users.team}`, color: "#60a5fa" },
        ].map(card => (
          <div key={card.label} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* 플랜 분포 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>플랜 분포</div>
          {[
            { label: "🆓 스타터", count: data.users.free, color: T.muted },
            { label: "⚡ Pro", count: data.users.pro, color: T.accent },
            { label: "🚀 Team", count: data.users.team, color: "#60a5fa" },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span>{p.label}</span>
              <span style={{ fontWeight: 700, color: p.color }}>{p.count}명</span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 12, color: T.muted }}>
            유료 전환율: <strong style={{ color: T.text }}>
              {data.users.total > 0 ? Math.round(((data.users.pro + data.users.team) / data.users.total) * 100) : 0}%
            </strong>
          </div>
        </div>

        {/* 최근 이벤트 */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>최근 결제 이벤트</div>
          {data.recentEvents.length === 0 ? (
            <p style={{ color: T.muted, fontSize: 13 }}>이벤트 없음</p>
          ) : data.recentEvents.map((ev, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
              <div>
                <span style={{ color: ev.type.includes("fail") ? T.red : T.green }}>
                  {EVENT_LABEL[ev.type] ?? ev.type}
                </span>
                <span style={{ color: T.muted, marginLeft: 8 }}>{new Date(ev.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
              {ev.amount > 0 && <span style={{ color: T.accent, fontWeight: 600 }}>{ev.amount.toLocaleString()}원</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
