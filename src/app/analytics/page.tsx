"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const T = {
  bg: "#050508", panel: "#0b0b14", surface: "#0f0f1a",
  border: "rgba(255,255,255,0.07)", text: "#d4d8e2",
  muted: "#4a5066", accent: "#f97316", accentB: "#f43f5e",
  green: "#22c55e", blue: "#3b82f6",
};

type Project = { id: string; name: string; updatedAt: string };
type PublishedApp = { slug: string; name: string; views: number; created_at: string };

const DAYS_7  = Array.from({ length: 7  }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }); });
const DAYS_30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }); });

function MiniBarChart({ data, color, height = 60 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: "2px 2px 0 0", background: color, opacity: 0.3 + 0.7 * (v / max), height: `${Math.max(4, (v / max) * 100)}%`, transition: "height 0.3s" }} />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [publishedApps, setPublishedApps] = useState<PublishedApp[]>([]);
  const [period, setPeriod] = useState<"7d" | "30d">("7d");
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [tokenBalance, setTokenBalance] = useState(50000);
  const [serverTotalViews, setServerTotalViews] = useState<number | null>(null);
  const [serverAppCount, setServerAppCount] = useState<number | null>(null);

  useEffect(() => {
    // Load from localStorage first
    try {
      const projs = JSON.parse(localStorage.getItem("f9_projects_v3") ?? "[]") as Project[];
      setProjects(projs);
    } catch {}
    try {
      const tok = localStorage.getItem("f9_tokens_v1");
      if (tok) setTokenBalance(parseInt(tok));
    } catch {}

    // Fetch real analytics from server
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        if (typeof d.tokenBalance === "number") setTokenBalance(d.tokenBalance);
        if (typeof d.totalViews === "number") setServerTotalViews(d.totalViews);
        if (typeof d.appCount === "number") setServerAppCount(d.appCount);
        if (Array.isArray(d.apps)) setPublishedApps(d.apps);
        if (Array.isArray(d.projects) && d.projects.length > 0) {
          setProjects(prev => {
            const ids = new Set(prev.map(p => p.id));
            const merged = [...prev];
            for (const sp of d.projects) if (!ids.has(sp.id)) merged.push({ id: sp.id, name: sp.name, updatedAt: sp.updated_at ?? sp.updatedAt });
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const labels = period === "7d" ? DAYS_7 : DAYS_30;
  // Use real server data only — no fake fallback
  const displayTotalViews = serverTotalViews ?? 0;
  const displayAppCount   = serverAppCount   ?? publishedApps.length;
  // avgPerDay: 첫 앱 배포일부터 오늘까지 경과 일수로 나눔 (누적 뷰 / 경과일)
  const avgPerDay = (() => {
    if (displayTotalViews === 0 || publishedApps.length === 0) return 0;
    const oldest = publishedApps.reduce((min, a) => a.created_at < min ? a.created_at : min, publishedApps[0].created_at);
    const daysSince = Math.max(1, Math.round((Date.now() - new Date(oldest).getTime()) / 86400000));
    return Math.round(displayTotalViews / daysSince);
  })();

  const STATS = [
    { label: "총 조회수", value: serverTotalViews !== null ? displayTotalViews.toLocaleString() : "—", icon: "👁️", color: T.blue, change: serverTotalViews !== null ? "실시간" : "로딩 중" },
    { label: "배포된 앱", value: serverAppCount !== null ? displayAppCount.toLocaleString() : "—", icon: "🚀", color: T.green, change: serverAppCount !== null ? "실시간" : "로딩 중" },
    { label: "일평균 조회수", value: serverTotalViews !== null ? avgPerDay.toLocaleString() : "—", icon: "📈", color: "#a78bfa", change: "실시간" },
    { label: "토큰 잔액", value: tokenBalance.toLocaleString(), icon: "⚡", color: tokenBalance < 5000 ? T.accentB : T.accent, change: `${Math.round((tokenBalance / 50000) * 100)}%` },
  ];

  // Chart: per-app views as bars (real data)
  const chartData = publishedApps.slice(0, labels.length).map(a => a.views);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard","Inter",-apple-system,sans-serif' }}>
      {/* Nav */}
      <nav style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#fff" }}>F9</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>FieldNine</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>분석</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/gallery")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🖼 갤러리</button>
          <button onClick={() => router.push("/workspace")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>워크스페이스</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>앱 분석 대시보드</h1>
            <p style={{ fontSize: 13, color: T.muted }}>배포된 앱의 트래픽과 사용량을 확인하세요.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* App selector */}
            <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
              <option value="all">모든 앱</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {/* Period toggle */}
            <div style={{ display: "flex", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              {(["7d", "30d"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: "7px 14px", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", background: period === p ? `${T.accent}22` : "transparent", color: period === p ? T.accent : T.muted }}>
                  {p === "7d" ? "7일" : "30일"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "20px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: 10 }}>{s.change}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart — real per-app views */}
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>배포된 앱별 조회수</div>
            <div style={{ fontSize: 12, color: T.muted }}>실시간</div>
          </div>
          {chartData.length > 0 ? (
            <>
              <MiniBarChart data={chartData} color={T.accent} height={120} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {publishedApps.slice(0, 3).map(a => (
                  <span key={a.slug} style={{ fontSize: 10, color: T.muted, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13, flexDirection: "column", gap: 8, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
              <span style={{ fontSize: 28 }}>📊</span>
              <span>앱을 배포하면 조회수 차트가 표시됩니다</span>
            </div>
          )}
        </div>

        {/* Token usage */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Token balance */}
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚡ 토큰 잔액</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: tokenBalance < 5000 ? T.accentB : T.accent, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {tokenBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>≈ ${(tokenBalance / 1000).toFixed(2)} USD</div>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", borderRadius: 6, background: tokenBalance < 5000 ? "linear-gradient(90deg,#f43f5e,#f97316)" : "linear-gradient(90deg,#f97316,#22c55e)", width: `${Math.min(100, (tokenBalance / 50000) * 100)}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>{Math.round((tokenBalance / 50000) * 100)}% 남음</div>
            <button onClick={() => router.push("/pricing")}
              style={{ marginTop: 14, width: "100%", padding: "9px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              토큰 충전하기 →
            </button>
          </div>

          {/* Projects count */}
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📁 내 프로젝트</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: T.green, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {projects.length > 0 ? projects.length : "—"}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>개 프로젝트</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
              {publishedApps.length > 0
                ? `${publishedApps.length}개 앱 배포됨`
                : "아직 배포된 앱이 없습니다."}
            </div>
            <button onClick={() => router.push("/workspace")}
              style={{ marginTop: 14, width: "100%", padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              워크스페이스 →
            </button>
          </div>
        </div>

        {/* My apps table — real published apps */}
        {publishedApps.length > 0 && (
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🚀 배포된 앱 현황</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 140px 100px 44px", gap: 12, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>앱 이름</span><span>조회수</span><span>URL</span><span>배포일</span><span></span>
              </div>
              {publishedApps.map((app, i) => (
                <div key={app.slug}
                  style={{ display: "grid", gridTemplateColumns: "1fr 80px 140px 100px 44px", gap: 12, padding: "11px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: 12, transition: "background 0.1s", alignItems: "center", borderRadius: i === publishedApps.length - 1 ? "0 0 8px 8px" : 0 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🌐 {app.name}</span>
                  <span style={{ color: T.blue, fontWeight: 700 }}>{app.views.toLocaleString()}</span>
                  <a href={`/p/${app.slug}`} target="_blank" rel="noreferrer"
                    style={{ color: T.accent, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}
                    onClick={e => e.stopPropagation()}>
                    /p/{app.slug}
                  </a>
                  <span style={{ color: T.muted }}>{new Date(app.created_at).toLocaleDateString("ko-KR")}</span>
                  <button
                    onClick={async () => {
                      if (!confirm(`"${app.name}" 앱을 삭제할까요? 되돌릴 수 없습니다.`)) return;
                      const res = await fetch(`/api/published/${app.slug}`, { method: "DELETE" });
                      if (res.ok) setPublishedApps(prev => prev.filter(a => a.slug !== app.slug));
                      else alert("앱 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
                    }}
                    style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                    title="앱 삭제"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My projects table */}
        {projects.length > 0 && (
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📁 내 프로젝트 현황</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px", gap: 12, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>프로젝트</span><span>파일</span><span>수정일</span>
              </div>
              {projects.map((proj, i) => (
                <div key={proj.id} onClick={() => openInWorkspace(proj.id, router)}
                  style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px", gap: 12, padding: "11px 12px", borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer", fontSize: 12, transition: "background 0.1s", borderRadius: i === projects.length - 1 ? "0 0 8px 8px" : 0 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💻 {proj.name}</span>
                  <span style={{ color: T.muted }}>-</span>
                  <span style={{ color: T.muted }}>{new Date(proj.updatedAt ?? proj.updatedAt).toLocaleDateString("ko-KR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && publishedApps.length === 0 && serverAppCount === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", border: `1px dashed ${T.border}`, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>아직 분석할 앱이 없어요</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>앱을 배포하면 조회수, 체류 시간, AI 사용량 등을 확인할 수 있습니다.</div>
            <button onClick={() => router.push("/workspace")}
              style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              첫 앱 만들기 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function openInWorkspace(projectId: string, router: ReturnType<typeof useRouter>) {
  localStorage.setItem("f9_cur_proj", projectId);
  router.push("/workspace");
}
