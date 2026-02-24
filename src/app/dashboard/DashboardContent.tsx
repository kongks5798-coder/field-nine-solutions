"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import { PROJ_KEY, CUR_KEY } from "@/app/workspace/workspace.constants";

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

// ── Usage summary widget ────────────────────────────────────────────────────
type UsageItem = { icon: string; label: string; current: number; max: number; maxLabel: string; unit: string };

function UsageWidgets() {
  const [items, setItems] = useState<UsageItem[]>([]);

  useEffect(() => {
    // Read from localStorage or use defaults
    const getNum = (key: string, fallback: number) => {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? Number(v) : fallback;
      } catch { return fallback; }
    };

    setItems([
      { icon: "\uD83E\uDD16", label: "AI \uC0AC\uC6A9\uB7C9", current: getNum("dalkak_usage_ai", 32), max: getNum("dalkak_limit_ai", 100), maxLabel: "100\uD68C", unit: "\uD68C" },
      { icon: "\uD83D\uDCC1", label: "\uD504\uB85C\uC81D\uD2B8", current: getNum("dalkak_usage_projects", 5), max: getNum("dalkak_limit_projects", 0), maxLabel: "\u221E", unit: "\uAC1C" },
      { icon: "\u2601\uFE0F", label: "\uC2A4\uD1A0\uB9AC\uC9C0", current: getNum("dalkak_usage_storage", 128), max: getNum("dalkak_limit_storage", 1024), maxLabel: "1GB", unit: "MB" },
      { icon: "\uD83D\uDC65", label: "\uD300\uC6D0", current: getNum("dalkak_usage_members", 1), max: getNum("dalkak_limit_members", 5), maxLabel: "5\uBA85", unit: "\uBA85" },
    ]);
  }, []);

  if (items.length === 0) return null;

  const getBarColor = (ratio: number) => {
    if (ratio >= 0.9) return "linear-gradient(90deg,#f87171,#ef4444)";
    if (ratio >= 0.7) return "linear-gradient(90deg,#f97316,#fb923c)";
    return "linear-gradient(90deg,#22c55e,#16a34a)";
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 12 }}>
        {"\uC0AC\uC6A9\uB7C9 \uC694\uC57D"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 12 }}>
        {items.map(item => {
          const ratio = item.max > 0 ? item.current / item.max : 0;
          const barColor = getBarColor(ratio);
          const pct = item.max > 0 ? Math.min(100, ratio * 100) : 0;

          return (
            <div key={item.label} style={{
              padding: "16px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.07)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0" }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                  {item.current}{item.unit} / {item.maxLabel}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 8, borderRadius: 4,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: item.max > 0 ? `${pct}%` : "0%",
                  background: barColor,
                  transition: "width 0.5s ease-out",
                }} />
              </div>
              {/* Percentage label */}
              {item.max > 0 && (
                <div style={{
                  marginTop: 6, fontSize: 10, fontWeight: 600,
                  color: ratio >= 0.9 ? "#f87171" : ratio >= 0.7 ? "#f97316" : "#22c55e",
                }}>
                  {Math.round(pct)}% {"\uC0AC\uC6A9"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardContent() {
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
      .catch((err) => { console.error('[Dalkak]', err); });

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
          const local = JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[];
          setProjects(local.slice(0, 6));
        } catch {}
      });

    // Fetch published apps
    fetch("/api/published?limit=6&sort=views")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.apps)) setPublished(d.apps); })
      .catch((err) => { console.error('[Dalkak]', err); });

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

  const totalViews = useMemo(() => published.reduce((s, a) => s + (a.views ?? 0), 0), [published]);
  const isNewUser = useMemo(() => projects.length === 0 && published.length === 0 && totalViews === 0, [projects.length, published.length, totalViews]);

  return (
    <div aria-busy={loading} style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard",Inter,-apple-system,sans-serif' }}>

      {/* Nav */}
      <nav aria-label="대시보드 내비게이션" style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(12px, 3vw, 28px)", background: "rgba(9,16,30,0.9)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100,
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button onClick={() => router.push("/")} aria-label="Dalkak 홈으로" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", minHeight: 44, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Dalkak</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>대시보드</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => router.push("/workspace")} aria-label="새 프로젝트 만들기" style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
            + 새 앱 만들기
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(20px, 4vw, 36px) clamp(12px, 3vw, 24px) 80px" }}>

        {/* Trial countdown banner */}
        {meData?.onTrial && meData.trialDaysLeft !== null && (
          <div style={{
            marginBottom: 24, padding: "14px 20px", borderRadius: 12,
            background: meData.trialDaysLeft <= 3 ? "rgba(248,113,113,0.08)" : "rgba(249,115,22,0.08)",
            border: `1px solid ${meData.trialDaysLeft <= 3 ? "rgba(248,113,113,0.25)" : "rgba(249,115,22,0.25)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 auto", minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{meData.trialDaysLeft <= 3 ? "⚠️" : "⏳"}</span>
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

        {/* Usage summary widgets */}
        <UsageWidgets />

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(200px, 100%),1fr))", gap: 12, marginBottom: 40 }}>
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
        <div className="dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>

          {/* Plan card */}
          <div style={{ padding: "clamp(16px, 3vw, 24px)", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
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
          <div style={{ padding: "clamp(16px, 3vw, 24px)", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 14 }}>빠른 실행</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "⚡", label: "워크스페이스 열기", desc: "코드 작성 & AI 생성", path: "/workspace", color: T.accent },
                { icon: "🤝", label: "코워크 (협업)", desc: "공유 문서 실시간 편집", path: "/cowork", color: T.blue },
                { icon: "☁️", label: "클라우드 스토리지", desc: "파일 업로드 & 관리", path: "/cloud", color: T.green },
                { icon: "🌐", label: "도메인 연결", desc: "커스텀 도메인 설정", path: "/domains", color: "#a78bfa" },
              ].map(a => (
                <button key={a.path} onClick={() => router.push(a.path)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", textAlign: "left", minHeight: 48, width: "100%" }}
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
              padding: "48px 32px", borderRadius: 24,
              background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(244,63,94,0.06) 50%, rgba(96,165,250,0.06) 100%)",
              border: `1px solid rgba(249,115,22,0.15)`,
              textAlign: "center",
              animation: "fadeIn 0.4s ease-out",
            }}>
              {/* Large icon */}
              <div style={{
                width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px",
                background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(244,63,94,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 40,
              }}>
                {"\uD83D\uDCBB"}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>
                {"\uCCAB \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694!"}
              </h3>
              <p style={{ fontSize: 14, color: T.muted, marginBottom: 32, lineHeight: 1.7 }}>
                {"AI\uC5D0\uAC8C \uB9D0\uD558\uAC70\uB098 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD574\uC11C \uBA87 \uCD08 \uB9CC\uC5D0 \uC571\uC744 \uB9CC\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}
              </p>

              {/* Two CTA buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 28 }}>
                <button onClick={() => router.push("/workspace")}
                  style={{
                    padding: "14px 32px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff",
                    fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 20px rgba(249,115,22,0.3)", transition: "all 0.18s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(249,115,22,0.45)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.3)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  {"\u2728"} {"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}
                </button>
                <button onClick={() => router.push("/workspace?template=true")}
                  style={{
                    padding: "14px 32px", borderRadius: 12,
                    border: `1px solid ${T.border}`,
                    background: "rgba(255,255,255,0.04)", color: T.text,
                    fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.18s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(96,165,250,0.35)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  {"\uD83D\uDCE6"} {"\uD15C\uD50C\uB9BF\uC73C\uB85C \uC2DC\uC791"}
                </button>
              </div>

              {/* Example project type cards */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "\uD83D\uDCAC", label: "\uCC44\uD305\uC571", prompt: "\uC2E4\uC2DC\uAC04 \uCC44\uD305 \uC571\uC744 \uB9CC\uB4E4\uC5B4\uC918" },
                  { icon: "\uD83C\uDFAE", label: "\uAC8C\uC784", prompt: "\uAC04\uB2E8\uD55C \uC6F9 \uAC8C\uC784\uC744 \uB9CC\uB4E4\uC5B4\uC918" },
                  { icon: "\uD83D\uDCCA", label: "\uB300\uC2DC\uBCF4\uB4DC", prompt: "\uB370\uC774\uD130 \uB300\uC2DC\uBCF4\uB4DC\uB97C \uB9CC\uB4E4\uC5B4\uC918" },
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

              {/* Tip */}
              <div style={{ marginTop: 8, padding: "12px 20px", borderRadius: 10, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "inline-block" }}>
                <span style={{ fontSize: 13, color: T.muted }}>
                  {"\uD83D\uDCA1"} <strong style={{ color: T.text }}>Tip:</strong> {"\uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uAC83\uC744 AI\uC5D0\uAC8C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC124\uBA85\uD558\uBA74 \uB429\uB2C8\uB2E4."}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {projects.map(proj => (
                <div key={proj.id} role="article" aria-label={`프로젝트: ${proj.name}`}
                  onClick={() => { localStorage.setItem(CUR_KEY, proj.id); router.push("/workspace"); }}
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
              <div role="button" aria-label="새 프로젝트 만들기" onClick={() => router.push("/workspace")}
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
                    <button onClick={() => window.open(`/p/${app.slug}`, "_blank")} aria-label={`${app.name} 앱 열기`}
                      style={{ flex: 1, padding: "6px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      열기
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${app.slug}`); }} aria-label={`${app.name} 링크 복사`}
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
          .dashboard-two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dashboard-two-col { gap: 12px !important; }
        }
      `}</style>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
