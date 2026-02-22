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

const EVENT_COLORS: Record<string, string> = {
  payment_succeeded:    T.green,
  subscription_created: T.blue,
  subscription_canceled:T.red,
  subscription_expired: T.yellow,
  payment_failed:       T.red,
  refund_issued:        T.yellow,
};

const EVENT_ICONS: Record<string, string> = {
  payment_succeeded:    "✓",
  subscription_created: "+",
  subscription_canceled:"×",
  subscription_expired: "⏰",
  payment_failed:       "!",
  refund_issued:        "↩",
};

type Event = {
  id:          string;
  user_id:     string;
  type:        string;
  amount:      number;
  description: string;
  created_at:  string;
  profiles: { email: string } | null;
};

function exportCsv(events: Event[]) {
  const rows = [
    ["ID", "이메일", "유형", "금액", "설명", "날짜"],
    ...events.map(e => [
      e.id,
      e.profiles?.email ?? e.user_id,
      e.type,
      String(e.amount),
      e.description,
      new Date(e.created_at).toLocaleString("ko-KR"),
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `billing_events_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminBillingPage() {
  const [events,    setEvents]    = useState<Event[]>([]);
  const [total,     setTotal]     = useState(0);
  const [mrr,       setMrr]       = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [typeF,     setTypeF]     = useState("");
  const [from,      setFrom]      = useState("");
  const [to,        setTo]        = useState("");
  const [page,      setPage]      = useState(0);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (typeF) params.set("type", typeF);
    if (from)  params.set("from", from);
    if (to)    params.set("to",   to);
    try {
      const r = await fetch(`/api/admin/billing-events?${params}`);
      if (!r.ok) { setError("로드 실패"); return; }
      const d = await r.json();
      setEvents(d.events ?? []);
      setTotal(d.total ?? 0);
      setMrr(d.monthlyRevenue ?? 0);
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  }, [typeF, from, to, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>결제 이벤트</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>이번달 매출: <span style={{ color: T.green, fontWeight: 700 }}>₩{mrr.toLocaleString()}</span></p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportCsv(events)} style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.blue, cursor: "pointer", fontWeight: 600 }}>
            CSV 내보내기
          </button>
          <button onClick={load} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
            새로고침
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={typeF}
          onChange={e => { setTypeF(e.target.value); setPage(0); }}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }}
        >
          <option value="">전체 유형</option>
          <option value="payment_succeeded">결제 성공</option>
          <option value="subscription_created">구독 생성</option>
          <option value="subscription_canceled">구독 취소</option>
          <option value="subscription_expired">구독 만료</option>
          <option value="payment_failed">결제 실패</option>
          <option value="refund_issued">환불</option>
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(0); }}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }} />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(0); }}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }} />
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, padding: 20 }}>{error}</div>
      ) : (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "30px 2fr 1.5fr 1fr 1fr 120px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", gap: 8 }}>
              <span></span><span>사용자</span><span>설명</span><span>유형</span><span>금액</span><span>날짜</span>
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>이벤트 없음</div>
            ) : events.map(ev => {
              const color = EVENT_COLORS[ev.type] ?? T.muted;
              return (
                <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "30px 2fr 1.5fr 1fr 1fr 120px", padding: "11px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color, fontWeight: 900, flexShrink: 0 }}>
                    {EVENT_ICONS[ev.type] ?? "·"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.profiles?.email ?? ev.user_id}</div>
                  </div>
                  <div style={{ color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.description}</div>
                  <div style={{ fontSize: 11, color }}>{ev.type.replace(/_/g, " ")}</div>
                  <div style={{ fontWeight: 700, color: ev.amount > 0 ? T.green : T.muted }}>
                    {ev.amount > 0 ? `+₩${ev.amount.toLocaleString()}` : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {new Date(ev.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
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
