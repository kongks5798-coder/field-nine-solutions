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

type Log = {
  id:          string;
  user_id:     string | null;
  action:      string;
  resource:    string | null;
  ip_address:  string | null;
  user_agent:  string | null;
  status_code: number | null;
  metadata:    Record<string, unknown> | null;
  created_at:  string;
  profiles:    { email: string } | null;
};

function StatusCode({ code }: { code: number | null }) {
  if (!code) return <span style={{ color: T.muted }}>—</span>;
  const c = code < 300 ? T.green : code < 400 ? T.blue : code < 500 ? T.yellow : T.red;
  return <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{code}</span>;
}

export default function AdminAuditPage() {
  const [logs,     setLogs]     = useState<Log[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [actionF,  setActionF]  = useState("");
  const [ipF,      setIpF]      = useState("");
  const [page,     setPage]     = useState(0);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
    if (actionF) params.set("action", actionF);
    if (ipF)     params.set("ip",     ipF);
    try {
      const r = await fetch(`/api/admin/audit-log?${params}`);
      if (!r.ok) { setError("로드 실패"); return; }
      const d = await r.json();
      setLogs(d.logs ?? []);
      setTotal(d.total ?? 0);
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  }, [actionF, ipF, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1400 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>감사 로그</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>전체 {total.toLocaleString()}건</p>
        </div>
        <button onClick={load} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
          새로고침
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={actionF}
          onChange={e => { setActionF(e.target.value); setPage(0); }}
          placeholder="액션 검색 (예: POST /api/...)"
          style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }}
        />
        <input
          value={ipF}
          onChange={e => { setIpF(e.target.value); setPage(0); }}
          placeholder="IP 주소 필터"
          style={{ width: 180, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, outline: "none" }}
        />
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, padding: 20 }}>{error}</div>
      ) : (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 100px 140px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", gap: 8 }}>
              <span>사용자</span><span>액션</span><span>IP</span><span>상태</span><span>리소스</span><span>날짜</span>
            </div>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>로그 없음</div>
            ) : logs.map(log => (
              <div key={log.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 100px 140px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", gap: 8, fontSize: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.profiles?.email ?? (log.user_id ? log.user_id.slice(0, 8) + "..." : "익명")}
                  </div>
                </div>
                <div style={{ color: T.blue, fontFamily: "monospace", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.action}
                </div>
                <div style={{ color: T.muted, fontSize: 11, fontFamily: "monospace" }}>
                  {log.ip_address ?? "—"}
                </div>
                <div><StatusCode code={log.status_code} /></div>
                <div style={{ color: T.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {log.resource ?? "—"}
                </div>
                <div style={{ color: T.muted, fontSize: 11 }}>
                  {new Date(log.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
