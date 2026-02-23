"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";

const T = {
  bg:      "#09101e",
  surface: "#0d1525",
  border:  "rgba(255,255,255,0.07)",
  accent:  "#f97316",
  accentB: "#f43f5e",
  text:    "#e8eaf0",
  muted:   "rgba(255,255,255,0.4)",
  green:   "#22c55e",
  blue:    "#60a5fa",
  red:     "#f87171",
};

type Project  = { id: string; name: string; files: Record<string, unknown>; updatedAt: string };
type UserInfo = { id: string; email: string; name?: string | null; avatarUrl?: string | null };
type MeData  = { user: UserInfo | null; plan: string | null; trialDaysLeft: number | null; onTrial: boolean; trialEndsAt: string | null };
type UsageData = {
  plan: string;
  metered?: { amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number };
};
type PublishedApp = { slug: string; name: string; views: number; created_at: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user,      setUser]      = useState<UserInfo | null>(null);
  const [meData,    setMeData]    = useState<MeData | null>(null);
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [published, setPublished] = useState<PublishedApp[]>([]);
  const [usage,     setUsage]     = useState<UsageData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const { toasts, showToast } = useToast(4000);

  useEffect(() => {
    // Fetch user + plan/trial info
    fetch("/api/auth/me")
      .then(r => r.json())
      .then((d: MeData) => { if (d.user) { setUser(d.user); setMeData(d); } })
      .catch(() => {});

    // Fetch projects
    fetch("/api/projects")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        if (Array.isArray(d.projects)) setProjects(d.projects.slice(0, 6));
      })
      .catch(() => {
        showToast("프로젝트 목록을 불러오지 못했습니다", "error");
        // Fallback to localStorage
        try {
          const local = JSON.parse(localStorage.getItem("f9_projects_v3") ?? "[]") as Project[];
          setProjects(local.slice(0, 6));
        } catch {}
      });

    // Fetch published apps
    fetch("/api/published?limit=6&sort=views")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.apps)) setPublished(d.apps); })
      .catch(() => {});

    // Fetch usage
    fetch("/api/billing/usage")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setUsage(d); })
      .catch(() => { showToast("사용량 정보를 불러오지 못했습니다", "error"); })
      .finally(() => setLoading(false));
  }, []);

  const planLabel: Record<string, string> = {
    starter: "스타터", core: "코어", pro: "프로", team: "팀",
  };
  const planColor: Record<string, string> = {
    starter: T.muted, core: T.blue, pro: T.accent, team: T.green,
  };

  const totalViews = published.reduce((s, a) => s + (a.views ?? 0), 0);
  const isNewUser = projects.length === 0 && published.length === 0 && totalViews === 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard",Inter,-apple-system,sans-serif' }}>

      {/* Nav */}
      <nav style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: "rgba(9,16,30,0.9)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Dalkak</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>대시보드</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/workspace")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + 새 앱 만들기
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Trial countdown banner */}
        {meData?.onTrial && meData.trialDaysLeft !== null && (
          <div style={{
            marginBottom: 24, padding: "14px 20px", borderRadius: 12,
            background: meData.trialDaysLeft <= 3 ? "rgba(248,113,113,0.08)" : "rgba(249,115,22,0.08)",
            border: `1px solid ${meData.trialDaysLeft <= 3 ? "rgba(248,113,113,0.25)" : "rgba(249,115,22,0.25)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{meData.trialDaysLeft <= 3 ? "⚠️" : "⏳"}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: meData.trialDaysLeft <= 3 ? T.red : T.accent }}>
                  무료 체험 {meData.trialDaysLeft === 0 ? "오늘 종료" : `${meData.trialDaysLeft}일 남음`}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {meData.trialDaysLeft <= 3 ? "체험 종료 후 무료 플랜으로 자동 전환됩니다." : "Pro 플랜을 무료로 체험 중입니다."}
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/pricing")} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: meData.trialDaysLeft <= 3 ? T.red : T.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              지금 업그레이드
            </button>
          </div>
        )}

        {/* Welcome */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {loading ? "로딩 중..." : `안녕하세요${user?.name ? `, ${user.name}님` : ""}! 👋`}
          </h1>
          <p style={{ fontSize: 14, color: T.muted }}>오늘도 멋진 앱을 만들어보세요.</p>
        </div>

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 40 }}>
          {[
            {
              icon: "📦",
              label: "프로젝트",
              value: projects.length === 0 && isNewUser ? "시작하기" : projects.length.toString(),
              sub: projects.length === 0 && isNewUser ? "첫 프로젝트를 만들어보세요" : "총 프로젝트 수",
              color: T.blue,
              onClick: () => router.push(projects.length === 0 ? "/workspace" : "/gallery"),
              isEmpty: projects.length === 0 && isNewUser,
            },
            {
              icon: "🚀",
              label: "배포된 앱",
              value: published.length === 0 && isNewUser ? "시작하기" : published.length.toString(),
              sub: published.length === 0 && isNewUser ? "앱을 배포해보세요" : "공개 배포 완료",
              color: T.green,
              onClick: () => router.push(published.length === 0 ? "/workspace" : "/gallery"),
              isEmpty: published.length === 0 && isNewUser,
            },
            {
              icon: "👁️",
              label: "총 조회수",
              value: totalViews === 0 && isNewUser ? "—" : totalViews.toLocaleString(),
              sub: totalViews === 0 && isNewUser ? "배포 후 조회수가 집계됩니다" : "배포 앱 전체",
              color: T.accent,
              onClick: () => router.push("/analytics"),
              isEmpty: totalViews === 0 && isNewUser,
            },
            {
              icon: "🤖",
              label: "AI 사용",
              value: usage?.metered ? (usage.metered.ai_calls === 0 && isNewUser ? "시작하기" : `${usage.metered.ai_calls}회`) : usage ? "—" : "...",
              sub: usage?.metered ? (usage.metered.ai_calls === 0 && isNewUser ? "AI와 대화를 시작해보세요" : `이번 달 · ₩${usage.metered.amount_krw.toLocaleString()}`) : "이번 달",
              color: T.muted,
              onClick: () => router.push(isNewUser ? "/workspace" : "/billing"),
              isEmpty: (!usage?.metered || usage.metered.ai_calls === 0) && isNewUser,
            },
          ].map(s => (
            <div key={s.label} onClick={s.onClick}
              style={{
                padding: "20px 22px", borderRadius: 16,
                background: s.isEmpty ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${s.isEmpty ? "rgba(255,255,255,0.05)" : T.border}`,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${s.color}50`; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.isEmpty ? "rgba(255,255,255,0.05)" : T.border; (e.currentTarget as HTMLDivElement).style.background = s.isEmpty ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)"; }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{
                fontSize: s.isEmpty ? 16 : 28, fontWeight: s.isEmpty ? 700 : 900,
                letterSpacing: "-0.02em", color: s.isEmpty ? T.muted : s.color, lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Plan + Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>

          {/* Plan card */}
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 10 }}>현재 플랜</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: planColor[usage?.plan ?? "starter"] ?? T.muted }}>
                {planLabel[usage?.plan ?? "starter"] ?? usage?.plan ?? "—"}
              </div>
              {usage?.plan !== "starter" && (
                <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 10, fontWeight: 700, color: T.green }}>
                  활성
                </div>
              )}
            </div>
            {usage?.metered && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 4 }}>
                  <span>이번 달 사용</span>
                  <span style={{ color: usage.metered.amount_krw >= usage.metered.warn_threshold ? T.red : T.text }}>
                    ₩{usage.metered.amount_krw.toLocaleString()} / ₩{usage.metered.hard_limit.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${Math.min(100, (usage.metered.amount_krw / usage.metered.hard_limit) * 100)}%`,
                    background: usage.metered.amount_krw >= usage.metered.warn_threshold
                      ? "linear-gradient(90deg,#f97316,#f43f5e)"
                      : "linear-gradient(90deg,#22c55e,#16a34a)",
                    transition: "width 0.4s",
                  }} />
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push("/billing")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                청구 내역
              </button>
              <button onClick={() => router.push("/pricing")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {usage?.plan === "starter" ? "업그레이드" : "플랜 변경"}
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 14 }}>빠른 실행</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "⚡", label: "워크스페이스 열기", desc: "코드 작성 & AI 생성", path: "/workspace", color: T.accent },
                { icon: "🤝", label: "코워크 (협업)", desc: "공유 문서 실시간 편집", path: "/cowork", color: T.blue },
                { icon: "☁️", label: "클라우드 스토리지", desc: "파일 업로드 & 관리", path: "/cloud", color: T.green },
                { icon: "🌐", label: "도메인 연결", desc: "커스텀 도메인 설정", path: "/domains", color: "#a78bfa" },
              ].map(a => (
                <button key={a.path} onClick={() => router.push(a.path)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", textAlign: "left" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${a.color}40`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{a.desc}</div>
                  </div>
                  <span style={{ fontSize: 14, color: T.muted }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent projects */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>최근 프로젝트</h2>
            <button onClick={() => router.push("/gallery?tab=mine")} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              전체 보기 →
            </button>
          </div>
          {projects.length === 0 ? (
            <div style={{
              padding: "40px 32px", borderRadius: 20,
              background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(244,63,94,0.06) 50%, rgba(96,165,250,0.06) 100%)",
              border: `1px solid rgba(249,115,22,0.15)`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>
                Dalkak에 오신 것을 환영합니다!
              </h3>
              <p style={{ fontSize: 14, color: T.muted, marginBottom: 28 }}>
                AI로 첫 번째 앱을 만들어보세요.
              </p>

              {/* Example project type cards */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "💬", label: "채팅앱", prompt: "실시간 채팅 앱을 만들어줘" },
                  { icon: "🎮", label: "게임", prompt: "간단한 웹 게임을 만들어줘" },
                  { icon: "📊", label: "대시보드", prompt: "데이터 대시보드를 만들어줘" },
                ].map(t => (
                  <button key={t.label}
                    onClick={() => router.push(`/workspace?prompt=${encodeURIComponent(t.prompt)}`)}
                    style={{
                      padding: "16px 24px", borderRadius: 14, border: `1px solid ${T.border}`,
                      background: "rgba(255,255,255,0.03)", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      minWidth: 120, transition: "all 0.18s", fontFamily: "inherit",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(249,115,22,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(249,115,22,0.35)";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Main CTA */}
              <button onClick={() => router.push("/workspace")}
                style={{
                  padding: "12px 32px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff",
                  fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.3)", transition: "all 0.18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(249,115,22,0.45)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.3)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
              >
                ▶ 워크스페이스에서 시작하기
              </button>

              {/* Tip */}
              <div style={{ marginTop: 24, padding: "12px 20px", borderRadius: 10, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "inline-block" }}>
                <span style={{ fontSize: 13, color: T.muted }}>
                  💡 <strong style={{ color: T.text }}>Tip:</strong> 만들고 싶은 것을 AI에게 자연스럽게 설명하면 됩니다.
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {projects.map(proj => (
                <div key={proj.id}
                  onClick={() => { localStorage.setItem("f9_cur_proj", proj.id); router.push("/workspace"); }}
                  style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}50`; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>💻</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                    {" · "}
                    {Object.keys(proj.files || {}).length}개 파일
                  </div>
                </div>
              ))}
              {/* New project card */}
              <div onClick={() => router.push("/workspace")}
                style={{ padding: "16px 18px", borderRadius: 12, border: `1px dashed ${T.border}`, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 100, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
              >
                <div style={{ fontSize: 24, color: T.muted }}>+</div>
                <div style={{ fontSize: 12, color: T.muted }}>새 프로젝트</div>
              </div>
            </div>
          )}
        </div>

        {/* Deployed apps */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>배포된 앱</h2>
            {published.length > 0 && (
              <button onClick={() => router.push("/gallery")} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>전체 보기 →</button>
            )}
          </div>
          {published.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "32px 24px", borderRadius: 16,
              border: `1px dashed ${T.border}`, background: "rgba(255,255,255,0.015)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌐</div>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
                아직 배포된 앱이 없습니다.<br />
                워크스페이스에서 앱을 만들고 배포해보세요.
              </p>
              <button onClick={() => router.push("/workspace")}
                style={{
                  padding: "8px 22px", borderRadius: 8, border: "none",
                  background: T.green, color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                앱 만들러 가기 →
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {published.map(app => (
                <div key={app.slug} style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.green}50`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>/{app.slug}</div>
                    </div>
                    <div style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>👁 {app.views}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      열기
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${app.slug}`); }}
                      style={{ padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      링크 복사
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
