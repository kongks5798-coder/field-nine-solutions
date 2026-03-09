"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { T } from "@/lib/theme";

type App = {
  slug: string;
  name: string;
  views: number;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  profiles: { email: string; plan: string | null } | null;
};

const PLAN_COLOR: Record<string, string> = { pro: T.accent, team: T.blue };

function PlanBadge({ plan }: { plan: string | null }) {
  if (!plan) return <span style={{ fontSize: 10, color: T.muted }}>무료</span>;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${PLAN_COLOR[plan] ?? T.muted}22`, color: PLAN_COLOR[plan] ?? T.muted }}>
      {plan === "pro" ? "프로" : plan === "team" ? "팀" : plan}
    </span>
  );
}

function DeleteModal({ app, onClose, onDeleted }: { app: App; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setLoading(true); setErr("");
    const res = await fetch(`/api/admin/apps?slug=${encodeURIComponent(app.slug)}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) { setErr("삭제 실패"); return; }
    onDeleted(); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={onClose}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 380, maxWidth: "90vw" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>앱 삭제</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>
          <strong style={{ color: T.text }}>{app.name}</strong> (/{app.slug})를 삭제합니다.
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
          {app.profiles?.email} · 조회수 {app.views.toLocaleString()}회
        </div>
        <div style={{ padding: "12px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: 12, color: T.red, marginBottom: 20 }}>
          ⚠️ 이 작업은 되돌릴 수 없습니다. 댓글, 좋아요도 함께 삭제됩니다.
        </div>
        {err && <div style={{ fontSize: 12, color: T.red, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>
            취소
          </button>
          <button onClick={handleDelete} disabled={loading}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAppsPage() {
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState("newest");
  const [page,    setPage]    = useState(0);
  const [modal,   setModal]   = useState<App | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const limit = 30;

  const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : Promise.reject(r));
  const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit), sort });
  if (search) params.set("search", search);

  const { data, isLoading, error: swrError, mutate } = useSWR(`/api/admin/apps?${params}`, fetcher, { keepPreviousData: true });
  const apps: App[] = data?.apps ?? [];
  const total: number = data?.total ?? 0;

  const handleDeleted = useCallback(() => { mutate(); }, [mutate]);

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1200 }}>
      {modal && <DeleteModal app={modal} onClose={() => setModal(null)} onDeleted={handleDeleted} />}

      {/* 미리보기 오버레이 */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPreview(null)}>
          <div style={{ width: "90vw", maxWidth: 900, height: "80vh", borderRadius: 12, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
            onClick={e => e.stopPropagation()}>
            <iframe src={preview} style={{ width: "100%", height: "100%", border: "none" }} sandbox="allow-scripts allow-forms allow-modals allow-same-origin" />
          </div>
          <button onClick={() => setPreview(null)} style={{ marginTop: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>닫기</button>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>배포된 앱 관리</h1>
          <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>전체 {total.toLocaleString()}개 앱</p>
        </div>
        <button onClick={() => mutate()} style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 600 }}>
          새로고침
        </button>
      </div>

      {/* 검색 + 정렬 */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="앱 이름 또는 슬러그 검색..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none" }}
        />
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, outline: "none" }}>
          <option value="newest">최신순</option>
          <option value="views">조회수순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : swrError ? (
        <div style={{ color: T.red, padding: 20 }}>로드 실패</div>
      ) : (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            {/* 헤더행 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 1fr 1fr 120px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>앱 이름 / 슬러그</span><span>작성자</span><span>조회수</span><span>플랜</span><span>생성일</span><span>관리</span>
            </div>

            {apps.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>검색 결과 없음</div>
            ) : apps.map(app => (
              <div key={app.slug}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 1fr 1fr 120px", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, alignItems: "center", fontSize: 13 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>/{app.slug}</div>
                </div>
                <div style={{ fontSize: 12, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {app.profiles?.email ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{app.views.toLocaleString()}</div>
                <div><PlanBadge plan={app.profiles?.plan ?? null} /></div>
                <div style={{ fontSize: 11, color: T.muted }}>{new Date(app.created_at).toLocaleDateString("ko-KR")}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setPreview(`/p/${app.slug}`)}
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}
                  >
                    👁
                  </button>
                  <a href={`/p/${app.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>
                    ↗
                  </a>
                  <button
                    onClick={() => setModal(app)}
                    style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: `1px solid rgba(248,113,113,0.3)`, background: "rgba(248,113,113,0.06)", color: T.red, cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
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
