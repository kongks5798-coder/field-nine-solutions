"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import useSWR from "swr";

const T = {
  bg:      "#07080f",
  surface: "#0d1020",
  card:    "#111827",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#f97316",
  text:    "#e2e8f0",
  muted:   "#6b7280",
  red:     "#f87171",
  blue:    "#60a5fa",
};

type User = {
  id:             string;
  email:          string;
  full_name:      string | null;
  plan:           string | null;
  plan_expires_at:string | null;
  created_at:     string;
};

const PLAN_COLOR: Record<string, string> = { pro: T.accent, team: T.blue };
const PLAN_LABELS: Record<string, string> = { pro: "프로", team: "팀" };

function Badge({ plan }: { plan: string | null }) {
  if (!plan) return <span style={{ fontSize: 11, color: T.muted }}>무료</span>;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      background: `${PLAN_COLOR[plan] ?? T.muted}22`,
      color: PLAN_COLOR[plan] ?? T.muted,
    }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function PlanModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [plan, setPlan] = useState<string>(user.plan ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    const r = await fetch(`/api/admin/users/${user.id}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan || null }),
    });
    setSaving(false);
    if (!r.ok) { setErr("저장 실패"); return; }
    onSaved(); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={onClose}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 340, maxWidth: "90vw" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>플랜 변경</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>{user.email}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {[{ v: "", l: "무료" }, { v: "pro", l: "프로" }, { v: "team", l: "팀" }].map(({ v, l }) => (
            <label key={v} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              border: `1px solid ${plan === v ? T.accent : T.border}`, borderRadius: 8, cursor: "pointer",
              background: plan === v ? "rgba(249,115,22,0.08)" : "transparent",
            }}>
              <input type="radio" value={v} checked={plan === v} onChange={() => setPlan(v)} style={{ accentColor: T.accent }} />
              <span style={{ fontSize: 13, color: plan === v ? T.text : T.muted, fontWeight: plan === v ? 700 : 400 }}>{l}</span>
            </label>
          ))}
        </div>
        {err && <div style={{ fontSize: 12, color: T.red, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>
            취소
          </button>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [search,  setSearch]  = useState("");
  const [planF,   setPlanF]   = useState("");
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState<User | null>(null);
  const limit = 20;

  const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : Promise.reject(r));
  const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
  if (search) params.set("search", search);
  if (planF)  params.set("plan",   planF);
  const { data, isLoading: loading, error: swrError, mutate } = useSWR(
    `/api/admin/users?${params}`,
    fetcher
  );
  const users: User[] = data?.users ?? [];
  const total: number = data?.total ?? 0;
  const error = swrError ? "로드 실패" : "";



  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1100 }}>
      {modal && <PlanModal user={modal} onClose={() => setModal(null)} onSaved={() => mutate()} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>사용자 관리</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>전체 {total.toLocaleString()}명</p>
        </div>
        <button onClick={() => mutate()} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
          새로고침
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="이메일 검색..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none" }}
        />
        <select
          value={planF}
          onChange={e => { setPlanF(e.target.value); setPage(0); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none" }}
        >
          <option value="">전체 플랜</option>
          <option value="free">무료</option>
          <option value="pro">프로</option>
          <option value="team">팀</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, padding: 20 }}>{error}</div>
      ) : (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>이메일</span><span>플랜</span><span>만료일</span><span>가입일</span><span>관리</span>
            </div>
            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>검색 결과 없음</div>
            ) : users.map(u => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", fontSize: 13 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: T.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  {u.full_name && <div style={{ fontSize: 11, color: T.muted }}>{u.full_name}</div>}
                </div>
                <div><Badge plan={u.plan} /></div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString("ko-KR") : "—"}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>
                  {new Date(u.created_at).toLocaleDateString("ko-KR")}
                </div>
                <div>
                  <button onClick={() => setModal(u)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
                    변경
                  </button>
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
