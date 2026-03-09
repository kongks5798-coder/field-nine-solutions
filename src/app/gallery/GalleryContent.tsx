"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PROJ_KEY, CUR_KEY } from "@/app/workspace/workspace.constants";

type Project = { id: string; name: string; files: Record<string, { content: string }>; updatedAt: string };
type PublishedApp = { slug: string; name: string; views: number; user_id: string; created_at: string; updated_at: string };

const T = {
  bg: "#050508", panel: "#0b0b14", surface: "#0f0f1a",
  border: "rgba(255,255,255,0.07)", text: "#d4d8e2",
  muted: "#4a5066", accent: "#f97316", accentB: "#f43f5e",
  green: "#22c55e",
};

/** Format date as Korean: 2025년 1월 1일 */
function formatKoreanDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}

/** Mask user_id to anonymous short form: abcd-efgh → a***-e*** */
function maskUserId(uid: string | null | undefined): string {
  if (!uid) return "익명";
  const parts = uid.split("-");
  if (parts.length >= 2) {
    return `${parts[0][0]}***-${parts[1][0]}***`;
  }
  return `${uid[0]}***`;
}

/** Returns true if the app was published within the last 7 days */
function isNew(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
}

type ViewFilter = "전체" | "인기" | "신규";

const CATEGORIES = ["전체", "AI 앱", "비즈니스", "웹사이트", "게임", "기타"];

// Curated example apps (editorial picks — not real user apps)
const FEATURED_APPS = [
  { id: "f1", name: "AI 투자 분석기", author: "예시", category: "AI 앱", icon: "📈", desc: "GPT-4o로 주식/코인 뉴스를 분석해 투자 시그널을 생성합니다.", color: "#22c55e",
    prompt: "주식/코인 티커를 입력하면 최신 뉴스를 분석해 투자 시그널(매수/매도/관망)을 보여주는 AI 투자 분석기 앱을 만들어줘. Chart.js로 가격 차트도 포함하고 세련된 다크 UI로 만들어줘" },
  { id: "f2", name: "실시간 대시보드", author: "예시", category: "비즈니스", icon: "📊", desc: "Chart.js로 매출·사용자·전환율을 실시간 시각화합니다.", color: "#3b82f6",
    prompt: "매출, 사용자 수, 전환율, 방문자를 Chart.js로 실시간 시각화하는 비즈니스 대시보드 만들어줘. 다크 테마, 카드 형태 KPI, 라인/바/도넛 차트 모두 포함해줘" },
  { id: "f3", name: "뱀 게임 3D", author: "예시", category: "게임", icon: "🐍", desc: "Three.js로 만든 입체적인 뱀 게임. 시간이 지날수록 빨라집니다.", color: "#a78bfa",
    prompt: "Three.js로 3D 뱀 게임 만들어줘. WASD 또는 방향키로 조작, 사과 먹으면 점수와 속도 증가, 벽/자기 충돌 시 게임오버, 최고점수 저장, 파티클 이펙트 포함" },
  { id: "f4", name: "AI 여행 플래너", author: "예시", category: "AI 앱", icon: "✈️", desc: "목적지, 기간, 예산을 입력하면 AI가 최적 여행 일정을 생성합니다.", color: "#f97316",
    prompt: "목적지, 여행 기간, 예산, 여행 스타일(힐링/액티비티/미식)을 입력하면 날짜별 일정표를 생성해주는 AI 여행 플래너 앱 만들어줘. 지도 스타일 UI, 인쇄 기능 포함" },
  { id: "f5", name: "포트폴리오 빌더", author: "예시", category: "웹사이트", icon: "💼", desc: "드래그 앤 드롭으로 개발자 포트폴리오를 만드세요. 다크/라이트 모드 지원.", color: "#06b6d4",
    prompt: "이름, 직함, 스킬, 프로젝트를 입력하면 즉시 생성되는 개발자 포트폴리오 웹사이트 만들어줘. 다크/라이트 모드 토글, 스크롤 애니메이션, 타이핑 이펙트, 소셜 링크 포함" },
  { id: "f6", name: "CRM 미니", author: "예시", category: "비즈니스", icon: "👥", desc: "고객 정보, 상담 이력, 파이프라인을 한 페이지에서 관리합니다.", color: "#f43f5e",
    prompt: "고객 추가/수정/삭제, 상담 이력 기록, 영업 파이프라인(잠재/상담/계약/완료) 칸반 보드가 있는 CRM 앱 만들어줘. localStorage로 데이터 저장, 검색 필터, CSV 내보내기 포함" },
  { id: "f7", name: "AI 레시피 추천", author: "예시", category: "AI 앱", icon: "🍳", desc: "냉장고 재료를 입력하면 AI가 만들 수 있는 레시피를 추천합니다.", color: "#eab308",
    prompt: "냉장고에 있는 재료를 입력하면 만들 수 있는 레시피 3가지를 추천해주는 앱 만들어줘. 재료 태그 입력 UI, 레시피 카드(재료/순서/칼로리), 즐겨찾기 저장 기능 포함" },
  { id: "f8", name: "픽셀 아트 에디터", author: "예시", category: "기타", icon: "🎨", desc: "웹에서 바로 픽셀 아트를 그리고 PNG로 내보내세요.", color: "#8b5cf6",
    prompt: "캔버스 기반 픽셀 아트 에디터 만들어줘. 격자 크기 선택(8x8~64x64), 색상 팔레트, 펜/지우개/채우기 도구, 실행취소/되돌리기, PNG 다운로드 기능 포함" },
];

export default function GalleryContent() {
  const router = useRouter();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [publishedApps, setPublishedApps] = useState<PublishedApp[]>([]);
  const [activeTab, setActiveTab] = useState<"community" | "mine">("community");
  const [activeCategory, setActiveCategory] = useState("전체");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "newest">("views");
  const [forkingSlug, setForkingSlug] = useState<string | null>(null);

  useEffect(() => {
    // Load user's saved projects from localStorage first
    try {
      const projs = JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[];
      setMyProjects(projs);
    } catch {}

    // Load published apps from server (real DB)
    fetch("/api/published?limit=20&sort=views")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.apps) && d.apps.length > 0) setPublishedApps(d.apps); })
      .catch(() => {});

    // Sync user projects from server
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.projects) && d.projects.length > 0) {
          const local = (() => { try { return JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[]; } catch { return []; } })();
          const localIds = new Set(local.map((p: Project) => p.id));
          const merged = [...local];
          for (const sp of d.projects) if (!localIds.has(sp.id)) merged.push({ id: sp.id, name: sp.name, files: {}, updatedAt: sp.updated_at });
          setMyProjects(merged);
        }
      })
      .catch(() => {});
  }, []);

  const filteredFeatured = useMemo(() => FEATURED_APPS.filter(app => {
    const matchCat = activeCategory === "전체" || app.category === activeCategory;
    const matchSearch = !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }), [activeCategory, searchQuery]);

  // Real published apps filtered/sorted (no category field — always show, search applies)
  const filteredPublished = useMemo(() => publishedApps.filter(app => {
    const matchSearch = !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchView =
      viewFilter === "전체" ? true :
      viewFilter === "인기" ? app.views > 100 :
      viewFilter === "신규" ? isNew(app.created_at) :
      true;
    return matchSearch && matchView;
  }).sort((a, b) => {
    if (sortBy === "views") return b.views - a.views;
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  }), [publishedApps, searchQuery, sortBy, viewFilter]);

  // When category is selected, show filtered featured alongside live apps
  const showFeaturedAlways = activeCategory !== "전체" || publishedApps.length === 0;

  // Only count real published apps in community tab header
  const communityCount = publishedApps.length;

  const openInWorkspace = (projectId: string) => {
    localStorage.setItem(CUR_KEY, projectId);
    router.push("/workspace");
  };

  const handleFork = async (slug: string) => {
    setForkingSlug(slug);
    try {
      const res = await fetch("/api/projects/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "포크에 실패했습니다.");
        return;
      }
      router.push("/workspace?project=" + data.projectId);
    } catch {
      alert("포크 처리 중 오류가 발생했습니다.");
    } finally {
      setForkingSlug(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard","Inter",-apple-system,sans-serif' }}>
      {/* Nav */}
      <nav style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#fff" }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Dalkak</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>갤러리</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/analytics")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>📊 분석</button>
          <button onClick={() => router.push("/workspace")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ 앱 만들기</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "56px 24px 40px", background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.08)", fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 20 }}>
          ✦ 커뮤니티 앱 갤러리
        </div>
        <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.1 }}>
          만들어진 앱을 탐색하세요
        </h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
          커뮤니티가 만든 앱을 둘러보고, 마음에 드는 앱을 Fork해서<br />나만의 버전을 만들어보세요.
        </p>
        {/* Search */}
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="앱 이름이나 기능으로 검색..."
            style={{
              width: "100%", padding: "12px 16px 12px 44px", borderRadius: 12,
              background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
              color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 16 }}>🔍</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, padding: "0 24px 24px" }}>
        {[
          { id: "community" as const, label: "🌐 커뮤니티", count: communityCount },
          { id: "mine" as const, label: "📁 내 프로젝트", count: myProjects.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 20px", borderRadius: 10, border: `1px solid ${activeTab === tab.id ? T.accent : T.border}`,
              background: activeTab === tab.id ? `${T.accent}18` : "rgba(255,255,255,0.03)",
              color: activeTab === tab.id ? T.accent : T.muted,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
            {tab.label}
            <span style={{ marginLeft: 6, padding: "1px 7px", borderRadius: 10, fontSize: 10, background: activeTab === tab.id ? T.accent : "rgba(255,255,255,0.06)", color: activeTab === tab.id ? "#fff" : T.muted }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {activeTab === "community" ? (
          <>
            {/* Filters — category row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: `1px solid ${activeCategory === cat ? T.accent : T.border}`,
                      background: activeCategory === cat ? `${T.accent}18` : "transparent",
                      color: activeCategory === cat ? T.accent : T.muted,
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                    }}>{cat}</button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
                <option value="views">조회수순</option>
                <option value="newest">최신순</option>
              </select>
            </div>
            {/* View filter tabs — 인기 / 신규 / 전체 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {(["전체", "인기", "신규"] as ViewFilter[]).map(f => {
                const icons: Record<ViewFilter, string> = { "전체": "📋", "인기": "🔥", "신규": "✨" };
                const counts: Record<ViewFilter, number> = {
                  "전체": publishedApps.length,
                  "인기": publishedApps.filter(a => a.views > 100).length,
                  "신규": publishedApps.filter(a => isNew(a.created_at)).length,
                };
                const active = viewFilter === f;
                return (
                  <button key={f} onClick={() => setViewFilter(f)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 10,
                      border: `1px solid ${active ? T.accent : T.border}`,
                      background: active ? `${T.accent}15` : "rgba(255,255,255,0.02)",
                      color: active ? T.accent : T.muted,
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    }}>
                    {icons[f]} {f}
                    <span style={{
                      padding: "1px 6px", borderRadius: 8, fontSize: 10,
                      background: active ? T.accent : "rgba(255,255,255,0.06)",
                      color: active ? "#fff" : T.muted,
                    }}>{counts[f]}</span>
                  </button>
                );
              })}
            </div>

            {/* Stats bar — real data only */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { label: "배포된 앱", value: publishedApps.length > 0 ? `${publishedApps.length}개` : "—", icon: "🚀" },
                { label: "총 조회수", value: publishedApps.length > 0 ? publishedApps.reduce((s, a) => s + (a.views ?? 0), 0).toLocaleString() : "—", icon: "👁️" },
                { label: "평균 생성 시간", value: "AI로 즉시", icon: "⚡" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", color: T.text }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top 3 popular apps — shown when there are real apps */}
            {filteredPublished.length >= 3 && !searchQuery && activeCategory === "전체" && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🏆</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>이번 주 인기 TOP 3</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {filteredPublished.slice(0, 3).map((app, rank) => {
                    const rankColors = ["#f59e0b", "#9ca3af", "#cd7c4e"];
                    const rankBg = ["rgba(245,158,11,0.1)", "rgba(156,163,175,0.07)", "rgba(205,124,78,0.08)"];
                    return (
                      <div key={app.slug} onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                        style={{
                          borderRadius: 14, border: `1px solid ${rankColors[rank]}30`,
                          background: rankBg[rank], cursor: "pointer", padding: "16px", transition: "all 0.15s", position: "relative", overflow: "hidden",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${rankColors[rank]}60`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = `${rankColors[rank]}30`; }}
                      >
                        <div style={{ fontSize: 24, fontWeight: 900, color: rankColors[rank], marginBottom: 8, lineHeight: 1 }}>#{rank + 1}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                        <div style={{ fontSize: 12, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                          <span>👁</span><span style={{ fontWeight: 700, color: rankColors[rank] }}>{app.views.toLocaleString()}</span><span>조회</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live published apps (always shown when available) */}
            {filteredPublished.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: T.green, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
                  라이브 앱 {filteredPublished.length}개
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
                  {filteredPublished.map(app => (
                  <div key={app.slug} style={{
                    borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`,
                    background: "rgba(255,255,255,0.03)", transition: "all 0.2s", cursor: "pointer",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}60`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(249,115,22,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    {/* Thumbnail — mini iframe preview */}
                    <div style={{ height: 148, overflow: "hidden", position: "relative", borderBottom: `1px solid ${T.border}`, background: "#050508" }}>
                      <iframe
                        src={`/p/${app.slug}`}
                        style={{ width: "560%", height: "560%", transform: "scale(0.178)", transformOrigin: "top left", border: "none", pointerEvents: "none" }}
                        loading="lazy"
                        sandbox=""
                        title={app.name}
                      />
                      {/* Badges */}
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 8, background: "rgba(34,197,94,0.85)", fontSize: 10, color: "#fff", fontWeight: 700 }}>
                          ✓ 배포됨
                        </span>
                        {isNew(app.created_at) && (
                          <span style={{ padding: "3px 8px", borderRadius: 8, background: "rgba(249,115,22,0.85)", fontSize: 10, color: "#fff", fontWeight: 700 }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <div style={{ position: "absolute", bottom: 10, right: 10, padding: "3px 8px", borderRadius: 8, background: "rgba(0,0,0,0.7)", fontSize: 11, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>👁</span>
                        <span>{app.views >= 1000 ? `${(app.views/1000).toFixed(1)}k` : app.views}</span>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                      {/* Meta row: author + date */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <span style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: `linear-gradient(135deg,#f97316,#f43f5e)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 900, flexShrink: 0 }}>U</span>
                          {maskUserId(app.user_id)}
                        </span>
                        <span style={{ fontSize: 11, color: T.muted }}>{formatKoreanDate(app.created_at)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                          ▶ 보기
                        </button>
                        <button
                          onClick={() => handleFork(app.slug)}
                          disabled={forkingSlug === app.slug}
                          title="이 앱을 내 워크스페이스로 복제"
                          style={{
                            flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                            background: forkingSlug === app.slug
                              ? "rgba(249,115,22,0.3)"
                              : "linear-gradient(135deg,#f97316,#f43f5e)",
                            color: "#fff", fontSize: 12, fontWeight: 700,
                            cursor: forkingSlug === app.slug ? "not-allowed" : "pointer",
                            fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}>
                          {forkingSlug === app.slug ? "⏳ 복제 중…" : "⚡ 이 앱으로 시작"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            {/* Empty state for view filter — when live apps exist but none match the filter */}
            {publishedApps.length > 0 && filteredPublished.length === 0 && !searchQuery && (
              <div style={{ textAlign: "center", padding: "48px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.5 }}>
                  {viewFilter === "인기" ? "🔥" : "✨"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  {viewFilter === "인기" ? "아직 인기 앱이 없어요" : "최근 7일 내 신규 앱이 없어요"}
                </div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
                  {viewFilter === "인기" ? "조회수 100 이상인 앱이 나타나면 여기에 표시됩니다." : "새 앱이 배포되면 여기에 표시됩니다."}
                </div>
                <button onClick={() => setViewFilter("전체")}
                  style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  전체 앱 보기
                </button>
              </div>
            )}

            {/* Featured / showcase apps — always shown, category-filtered */}
            {(showFeaturedAlways || filteredPublished.length === 0) && filteredFeatured.length > 0 && (
              <>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>✦</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                      {filteredPublished.length > 0 ? "큐레이션 쇼케이스" : "추천 앱 — AI로 즉시 만들어보세요"}
                    </span>
                  </div>
                  {filteredPublished.length === 0 && (
                    <span style={{ fontSize: 11, color: T.muted, padding: "3px 10px", borderRadius: 12, border: `1px solid ${T.border}` }}>
                      {filteredFeatured.length}개 예시
                    </span>
                  )}
                </div>

                {/* Top 3 highlighted featured cards — larger, shown first */}
                {filteredPublished.length === 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16, marginBottom: 16 }}>
                    {filteredFeatured.slice(0, 3).map(app => (
                      <div key={`feat-hero-${app.id}`} style={{
                        borderRadius: 18, overflow: "hidden",
                        border: `1px solid ${app.color}30`,
                        background: `linear-gradient(160deg, ${app.color}0d 0%, rgba(255,255,255,0.02) 100%)`,
                        transition: "all 0.2s", cursor: "pointer", position: "relative",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${app.color}60`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px ${app.color}20`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${app.color}30`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                      >
                        {/* Thumbnail */}
                        <div style={{ height: 160, background: `linear-gradient(135deg, ${app.color}30, ${app.color}0a)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, borderBottom: `1px solid ${app.color}20`, position: "relative" }}>
                          {app.icon}
                          <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: 10, background: `${app.color}22`, border: `1px solid ${app.color}40`, fontSize: 10, color: app.color, fontWeight: 700 }}>
                            {app.category}
                          </div>
                          <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 10, background: "rgba(249,115,22,0.15)", fontSize: 10, color: T.accent, fontWeight: 700 }}>
                            추천
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{ padding: "18px 18px 16px" }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6 }}>{app.name}</div>
                          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, marginBottom: 16 }}>{app.desc}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => router.push(`/workspace?q=${encodeURIComponent((app as { prompt?: string }).prompt || app.desc + " " + app.name + " 만들어줘")}`)}
                              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              ⚡ AI로 즉시 만들기
                            </button>
                            <button
                              onClick={async () => {
                                const prompt = (app as { prompt?: string }).prompt || app.desc + " " + app.name + " 만들어줘";
                                router.push(`/workspace?q=${encodeURIComponent(prompt)}&autostart=1`);
                              }}
                              title="이 앱을 내 워크스페이스로 복제"
                              style={{
                                padding: "10px 14px", borderRadius: 10,
                                background: "rgba(249,115,22,0.12)",
                                border: `1px solid rgba(249,115,22,0.3)`,
                                color: T.accent, fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", gap: 4,
                                whiteSpace: "nowrap",
                              }}>
                              ⑂ 시작
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remaining featured cards — standard grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {(filteredPublished.length === 0 ? filteredFeatured.slice(3) : filteredFeatured).map(app => (
                  <div key={app.id} style={{
                    borderRadius: 16, overflow: "hidden", border: `1px solid ${T.border}`,
                    background: "rgba(255,255,255,0.03)", transition: "all 0.2s", cursor: "pointer",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}60`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(249,115,22,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    {/* Thumbnail */}
                    <div style={{ height: 140, background: `linear-gradient(135deg, ${app.color}22, ${app.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, borderBottom: `1px solid ${T.border}`, position: "relative" }}>
                      {app.icon}
                      <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", borderRadius: 8, background: "rgba(0,0,0,0.4)", fontSize: 10, color: T.muted, fontWeight: 600 }}>
                        {app.category}
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{app.category} · 큐레이션 예시</div>
                      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 14 }}>{app.desc}</div>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button
                          onClick={() => router.push(`/workspace?q=${encodeURIComponent((app as { prompt?: string }).prompt || app.desc + " " + app.name + " 만들어줘")}`)}
                          style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          ⚡ AI로 즉시 만들기
                        </button>
                        <button
                          onClick={() => {
                            const prompt = (app as { prompt?: string }).prompt || app.desc + " " + app.name + " 만들어줘";
                            router.push(`/workspace?q=${encodeURIComponent(prompt)}&autostart=1`);
                          }}
                          title="이 앱을 내 워크스페이스로 복제"
                          style={{
                            padding: "8px 10px", borderRadius: 8,
                            border: `1px solid rgba(249,115,22,0.25)`,
                            background: "rgba(249,115,22,0.08)",
                            color: T.accent, fontSize: 11, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: 3,
                            whiteSpace: "nowrap",
                          }}>
                          ⑂ 시작
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            {filteredPublished.length === 0 && filteredFeatured.length === 0 && (
              <div style={{ textAlign: "center", padding: "72px 24px", color: T.muted }}>
                {/* Illustrated empty state */}
                <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>
                  🔍
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 10, letterSpacing: "-0.02em" }}>검색 결과 없음</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
                  &ldquo;{searchQuery}&rdquo;에 해당하는 앱이 없습니다.<br />
                  다른 키워드로 검색하거나, 직접 만들어보세요.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => setSearchQuery("")}
                    style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    검색 초기화
                  </button>
                  <button onClick={() => router.push("/workspace")}
                    style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    ⚡ 새 앱 만들기
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* My Projects */
          <div>
            {myProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 10 }}>아직 만든 앱이 없어요</div>
                <div style={{ fontSize: 14, color: T.muted, marginBottom: 28 }}>워크스페이스에서 첫 번째 앱을 만들어보세요.</div>
                <button onClick={() => router.push("/workspace")}
                  style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  앱 만들기 →
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {myProjects.map(proj => {
                  const fileCount = Object.keys(proj.files || {}).length;
                  const updatedAt = new Date(proj.updatedAt).toLocaleDateString("ko-KR");
                  return (
                    <div key={proj.id} style={{ borderRadius: 16, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)", transition: "all 0.2s", overflow: "hidden" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}60`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
                    >
                      {/* Thumbnail */}
                      <div style={{ height: 120, background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(244,63,94,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, borderBottom: `1px solid ${T.border}` }}>
                        💻
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{proj.name}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
                          {fileCount}개 파일 · 수정 {updatedAt}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openInWorkspace(proj.id)}
                            style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            ✎ 편집
                          </button>
                          <button onClick={() => {
                            const html = Object.values(proj.files)[0]?.content ?? "";
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
                            a.download = `${proj.name}.html`; a.click();
                          }}
                            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                            ⬇
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Add new */}
                <div onClick={() => router.push("/workspace?new=1")}
                  style={{ borderRadius: 16, border: `1.5px dashed ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 20px", cursor: "pointer", transition: "all 0.2s", minHeight: 240 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.accent; (e.currentTarget as HTMLDivElement).style.background = `${T.accent}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>새 프로젝트</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
