"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import { PROJ_KEY, CUR_KEY } from "@/app/workspace/workspace.constants";
import { StatCard } from "./components/StatCard";
import { ReferralWidget } from "@/components/ReferralWidget";

const T = {
  bg:      "#0d1117",
  surface: "#161b22",
  border:  "#30363d",
  accent:  "#f97316",
  accentB: "#f43f5e",
  text:    "#e6edf3",
  muted:   "#8b949e",
  dimmed:  "#6e7681",
  green:   "#3fb950",
  blue:    "#58a6ff",
  yellow:  "#d29922",
  red:     "#f85149",
};

// ── Types ────────────────────────────────────────────────────────────────────
type Project       = { id: string; name: string; files?: Record<string, unknown>; updatedAt?: string | null; updated_at?: string | null };
type PublishedApp  = { slug: string; name: string; views: number; created_at: string };
type UserInfo      = { id: string; email: string; name?: string | null; avatarUrl?: string | null };
type MeData        = { user: UserInfo | null; plan: string | null; trialDaysLeft: number | null; onTrial: boolean; trialEndsAt: string | null; lastLoginAt?: string | null };
type UsageData     = {
  plan: string;
  metered?: { amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number; monthly_limit?: number };
  usage?: Record<string, { used: number; quota: number; overage: number; overageCost: number }>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(val: string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("ko-KR");
}

function fmtDateTime(val: string | null | undefined): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function daysUntilReset(): number {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = nextMonth.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Token Usage Widget ────────────────────────────────────────────────────────
function TokenUsageWidget({ tokenBalance, tokenLimit = 50000, onUpgrade }: {
  tokenBalance: number | null;
  tokenLimit?: number;
  onUpgrade: () => void;
}) {
  if (tokenBalance === null) {
    return (
      <div style={{ padding: "20px 24px", borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
        <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,0.05)", width: "60%", marginBottom: 12 }} />
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
      </div>
    );
  }

  const used = tokenLimit - tokenBalance;
  const usedRatio = Math.min(1, Math.max(0, used / tokenLimit));
  const usedPct = Math.round(usedRatio * 100);
  const daysLeft = daysUntilReset();

  const barColor = usedRatio >= 0.95
    ? `linear-gradient(90deg, ${T.red}, #ef4444)`
    : usedRatio >= 0.8
    ? `linear-gradient(90deg, ${T.yellow}, #f97316)`
    : `linear-gradient(90deg, ${T.green}, #16a34a)`;

  const statusColor = usedRatio >= 0.95 ? T.red : usedRatio >= 0.8 ? T.yellow : T.green;

  return (
    <div style={{ padding: "20px 24px", borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em" }}>토큰 사용량</div>
        <div style={{ fontSize: 11, color: T.dimmed }}>{daysLeft}일 후 초기화</div>
      </div>

      {/* Circular-style display */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        {/* SVG Circle */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={80} height={80} viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
              cx={40} cy={40} r={32} fill="none"
              stroke={statusColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - usedRatio)}`}
              style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: statusColor, lineHeight: 1 }}>{usedPct}%</div>
            <div style={{ fontSize: 9, color: T.dimmed, marginTop: 2 }}>사용</div>
          </div>
        </div>

        {/* Text info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            이번 달 {used.toLocaleString()} / {tokenLimit.toLocaleString()} 토큰
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
            잔량: <span style={{ color: T.blue, fontWeight: 700 }}>{tokenBalance.toLocaleString()}개</span>
          </div>
          {/* Linear bar */}
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${usedPct}%`,
              background: barColor,
              transition: "width 0.6s ease-out",
            }} />
          </div>
        </div>
      </div>

      {/* Warnings */}
      {usedRatio >= 0.95 && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>⚠️ 토큰이 거의 소진되었습니다</span>
          <button onClick={onUpgrade} style={{ padding: "4px 12px", borderRadius: 7, border: "none", background: T.red, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            업그레이드
          </button>
        </div>
      )}
      {usedRatio >= 0.8 && usedRatio < 0.95 && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.2)", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: T.yellow, fontWeight: 600 }}>⚠️ 토큰의 80% 이상 사용했습니다. 절약해서 사용하세요.</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Link href="/billing" style={{ flex: 1, textAlign: "center", padding: "7px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, textDecoration: "none", fontWeight: 600 }}>
          충전 내역
        </Link>
        <button onClick={onUpgrade} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          토큰 충전
        </button>
      </div>
    </div>
  );
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function SkeletonBox({ w = "100%", h = 14, r = 7 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "rgba(255,255,255,0.05)",
      animation: "skeletonPulse 1.4s ease-in-out infinite",
    }} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardContent() {
  const router = useRouter();
  const [user,          setUser]         = useState<UserInfo | null>(null);
  const [meData,        setMeData]       = useState<MeData | null>(null);
  const [projects,      setProjects]     = useState<Project[]>([]);
  const [published,     setPublished]    = useState<PublishedApp[]>([]);
  const [usage,         setUsage]        = useState<UsageData | null>(null);
  const [tokenBalance,  setTokenBalance] = useState<number | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [searchQuery,   setSearchQuery]  = useState("");
  const { toasts, showToast } = useToast(4000);

  useEffect(() => {
    const fetchAll = async () => {
      // User + plan
      fetch("/api/auth/me")
        .then(r => r.json())
        .then((d: MeData) => { if (d.user) { setUser(d.user); setMeData(d); } })
        .catch((err) => { console.error("[Dashboard]", err); });

      // Projects
      fetch("/api/projects?limit=6&sort=updatedAt")
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(d => {
          if (Array.isArray(d.projects)) setProjects(d.projects.slice(0, 6));
        })
        .catch(() => {
          showToast("프로젝트 목록을 불러오지 못했습니다", "error");
          try {
            const local = JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[];
            setProjects(local.slice(0, 6));
          } catch { /* ignore */ }
        });

      // Published apps
      fetch("/api/published?limit=5&sort=views&user=me")
        .then(r => r.json())
        .then(d => { if (Array.isArray(d.apps)) setPublished(d.apps); })
        .catch((err) => { console.error("[Dashboard] published:", err); });

      // Usage
      fetch("/api/billing/usage")
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(d => { setUsage(d); })
        .catch(() => { showToast("사용량 정보를 불러오지 못했습니다", "error"); })
        .finally(() => setLoading(false));

      // Token balance
      fetch("/api/tokens")
        .then(r => r.json())
        .then(d => { if (typeof d.balance === "number") setTokenBalance(d.balance); })
        .catch((err) => { console.error("[Dashboard] tokens:", err); });
    };

    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const planLabel: Record<string, string> = {
    starter: "Free", core: "Core", pro: "Pro", team: "Team",
  };
  const planColor: Record<string, string> = {
    starter: T.muted, core: T.blue, pro: T.accent, team: T.green,
  };
  const planBg: Record<string, string> = {
    starter: "rgba(139,148,158,0.1)", core: "rgba(88,166,255,0.1)", pro: "rgba(249,115,22,0.1)", team: "rgba(63,185,80,0.1)",
  };

  const currentPlan = usage?.plan ?? meData?.plan ?? "starter";
  const totalViews = useMemo(() => published.reduce((s, a) => s + (a.views ?? 0), 0), [published]);
  const publishedCount = useMemo(() => published.length, [published]);
  const isNewUser = useMemo(() => projects.length === 0 && publishedCount === 0, [projects.length, publishedCount]);
  const filteredProjects = useMemo(
    () => searchQuery.trim()
      ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : projects,
    [projects, searchQuery]
  );

  const GRADS = [
    "linear-gradient(135deg,#667eea,#764ba2)",
    "linear-gradient(135deg,#f97316,#f43f5e)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#059669)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
  ];

  const APP_GRADS = [
    "linear-gradient(135deg,#1a1a2e,#16213e)",
    "linear-gradient(135deg,#0f3460,#533483)",
    "linear-gradient(135deg,#1a1a2e,#e94560)",
    "linear-gradient(135deg,#0f3460,#16213e)",
    "linear-gradient(135deg,#533483,#e94560)",
  ];

  return (
    <div
      aria-busy={loading}
      style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard",Inter,-apple-system,sans-serif' }}
    >
      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav aria-label="대시보드 내비게이션" style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(12px, 3vw, 28px)", background: "rgba(13,17,23,0.9)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100, gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button onClick={() => router.push("/")} aria-label="Dalkak 홈으로" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", minHeight: 44, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Dalkak</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>대시보드</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <Link href="/showcase" style={{ padding: "6px 12px", borderRadius: 7, fontSize: 13, color: T.muted, textDecoration: "none", fontWeight: 500 }}>쇼케이스</Link>
          <Link href="/settings" style={{ padding: "6px 12px", borderRadius: 7, fontSize: 13, color: T.muted, textDecoration: "none", fontWeight: 500 }}>설정</Link>
          <button onClick={() => router.push("/workspace")} aria-label="새 프로젝트 만들기" style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
            + 새 앱
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(20px, 4vw, 36px) clamp(12px, 3vw, 24px) 80px" }}>

        {/* ── Views notification banner ───────────────────────────── */}
        {!loading && totalViews > 0 && (
          <div style={{
            marginBottom: 20, padding: "14px 20px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(63,185,80,0.08), rgba(88,166,255,0.06))",
            border: "1px solid rgba(63,185,80,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🔥</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.green }}>
                  내 앱이 총 {totalViews.toLocaleString()}번 조회됐어요!
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {publishedCount}개 앱을 배포 중 · 계속 공유해서 방문자를 늘려보세요
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/gallery")} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
              앱 보기 →
            </button>
          </div>
        )}

        {/* ── Trial banner ────────────────────────────────────────── */}
        {meData?.onTrial && meData.trialDaysLeft !== null && (
          <div style={{
            marginBottom: 24, padding: "14px 20px", borderRadius: 12,
            background: meData.trialDaysLeft <= 3 ? "rgba(248,81,73,0.08)" : "rgba(249,115,22,0.08)",
            border: `1px solid ${meData.trialDaysLeft <= 3 ? "rgba(248,81,73,0.25)" : "rgba(249,115,22,0.25)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
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

        {/* ── Header: Welcome + plan badge + last login ─────────── */}
        <div style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {loading
                ? <SkeletonBox w={240} h={32} r={8} />
                : `안녕하세요${user?.name ? `, ${user.name}님` : ""}! 👋`
              }
            </h1>
            <p style={{ fontSize: 14, color: T.muted }}>오늘도 멋진 앱을 만들어보세요.</p>
            {meData?.lastLoginAt && (
              <p style={{ fontSize: 11, color: T.dimmed, marginTop: 4 }}>
                마지막 로그인: {fmtDateTime(meData.lastLoginAt)}
              </p>
            )}
          </div>

          {/* Plan badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              padding: "6px 16px", borderRadius: 20,
              background: planBg[currentPlan] ?? planBg.starter,
              border: `1px solid ${planColor[currentPlan] ?? T.muted}40`,
              fontSize: 13, fontWeight: 800,
              color: planColor[currentPlan] ?? T.muted,
              letterSpacing: "0.03em",
            }}>
              {planLabel[currentPlan] ?? currentPlan.toUpperCase()}
            </div>
            {currentPlan === "starter" && (
              <button onClick={() => router.push("/pricing")} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                업그레이드 →
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Row (4 cards) ──────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 36, flexWrap: "wrap" }}>
          {loading ? (
            <>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ flex: "1 1 150px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", minWidth: 150 }}>
                  <SkeletonBox w={32} h={24} r={6} />
                  <div style={{ marginTop: 8 }}><SkeletonBox w={80} h={28} r={6} /></div>
                  <div style={{ marginTop: 6 }}><SkeletonBox w="70%" h={12} /></div>
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                icon="📦"
                label="총 프로젝트 수"
                value={`${projects.length}개`}
                sub="내 전체 프로젝트"
                color={T.blue}
                onClick={() => router.push("/gallery?tab=mine")}
              />
              <StatCard
                icon="🤖"
                label="이번 달 AI 사용"
                value={usage?.metered ? `${usage.metered.ai_calls}회` : "—"}
                sub={usage?.metered ? `₩${usage.metered.amount_krw.toLocaleString()}` : "이번 달"}
                color={T.accent}
                onClick={() => router.push("/billing")}
              />
              <StatCard
                icon="🚀"
                label="퍼블리시된 앱"
                value={`${publishedCount}개`}
                sub={`총 조회수 ${totalViews.toLocaleString()}`}
                color={T.green}
                onClick={() => router.push("/gallery")}
              />
              <StatCard
                icon="🪙"
                label="토큰 잔량"
                value={tokenBalance !== null ? `${tokenBalance.toLocaleString()}개` : "..."}
                sub="사용 가능 토큰"
                color="#a78bfa"
                onClick={() => router.push("/billing")}
              />
            </>
          )}
        </div>

        {/* ── Main content grid ────────────────────────────────────── */}
        <div className="dashboard-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginBottom: 40, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ minWidth: 0 }}>

            {/* Recent Projects */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>최근 프로젝트</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 auto", maxWidth: 280 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.muted, pointerEvents: "none" }}>
                      <circle cx="7" cy="7" r="5"/><path d="M12 12l-2.5-2.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text" placeholder="프로젝트 검색..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <button onClick={() => router.push("/gallery?tab=mine")} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                  모든 프로젝트 보기 →
                </button>
              </div>

              {projects.length === 0 ? (
                <div style={{ padding: "48px 32px", borderRadius: 24, background: "linear-gradient(135deg,rgba(249,115,22,0.06),rgba(244,63,94,0.06),rgba(96,165,250,0.06))", border: "1px solid rgba(249,115,22,0.15)", textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(244,63,94,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>💻</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>아직 프로젝트가 없어요</h3>
                  <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.7 }}>첫 번째 앱을 만들어보세요! AI에게 말하거나 템플릿을 선택해서<br />몇 초 만에 앱을 만들 수 있습니다.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
                    <button onClick={() => router.push("/workspace")} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}>
                      ✨ 새 프로젝트
                    </button>
                    <button onClick={() => router.push("/workspace?template=true")} style={{ padding: "12px 28px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      📦 템플릿으로 시작
                    </button>
                  </div>
                </div>
              ) : filteredProjects.length === 0 && searchQuery ? (
                <div style={{ padding: "32px 24px", borderRadius: 16, border: `1px dashed ${T.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 13, color: T.muted }}>&quot;{searchQuery}&quot; 와 일치하는 프로젝트가 없습니다.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                  {filteredProjects.map((proj, i) => {
                    const updatedAt = proj.updatedAt ?? proj.updated_at;
                    return (
                      <div key={proj.id} role="article" aria-label={`프로젝트: ${proj.name}`}
                        onClick={() => { localStorage.setItem(CUR_KEY, proj.id); router.push("/workspace"); }}
                        style={{ borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(22,27,34,0.8)", cursor: "pointer", transition: "all 0.15s", overflow: "hidden" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}50`; (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.background = "rgba(22,27,34,0.8)"; }}
                      >
                        <div style={{ height: 56, background: GRADS[i % GRADS.length], opacity: 0.75 }} />
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                            {fmtDate(updatedAt) || "방금 전"}
                            {proj.files && ` · 파일 ${Object.keys(proj.files).length}개`}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); localStorage.setItem(CUR_KEY, proj.id); router.push("/workspace"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            열기 →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add new card */}
                  <div role="button" aria-label="새 프로젝트 만들기" onClick={() => router.push("/workspace")}
                    style={{ padding: "16px 18px", borderRadius: 12, border: `1px dashed ${T.border}`, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 110, transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.accent}50`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
                  >
                    <div style={{ fontSize: 24, color: T.muted }}>+</div>
                    <div style={{ fontSize: 12, color: T.muted }}>새 프로젝트</div>
                  </div>
                </div>
              )}
            </div>

            {/* Published Apps — horizontal scroll */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800 }}>퍼블리시된 앱</h2>
                {published.length > 0 && (
                  <button onClick={() => router.push("/gallery")} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>전체 보기 →</button>
                )}
              </div>

              {published.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 24px", borderRadius: 16, border: `1px dashed ${T.border}`, background: "rgba(22,27,34,0.5)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🌐</div>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
                    아직 배포된 앱이 없습니다.<br />워크스페이스에서 앱을 만들고 배포해보세요.
                  </p>
                  <button onClick={() => router.push("/workspace")} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    앱 만들러 가기 →
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin", scrollbarColor: `${T.border} transparent` }}>
                  {published.map((app, i) => (
                    <div key={app.slug} style={{
                      minWidth: 220, maxWidth: 220, borderRadius: 14, border: `1px solid ${T.border}`,
                      background: T.surface, overflow: "hidden", flexShrink: 0, transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${T.green}50`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
                    >
                      {/* Mini iframe thumbnail */}
                      <div style={{ height: 80, overflow: "hidden", position: "relative", background: "#050508" }}>
                        <iframe
                          src={`/p/${app.slug}`}
                          style={{ width: "556%", height: "556%", transform: "scale(0.18)", transformOrigin: "top left", border: "none", pointerEvents: "none" }}
                          loading="lazy"
                          sandbox=""
                          title={app.name}
                        />
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                        <div style={{ fontSize: 10, color: T.dimmed, marginBottom: 8 }}>/p/{app.slug}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.muted, marginBottom: 10 }}>
                          <span>👁 {app.views.toLocaleString()}</span>
                          <span style={{ color: T.dimmed }}>·</span>
                          <span>{fmtDate(app.created_at)}</span>
                        </div>
                        <Link href={`/p/${app.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", padding: "5px 0", borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                          열기 →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Referral Widget */}
            <ReferralWidget />

            {/* Token Usage Widget */}
            <TokenUsageWidget
              tokenBalance={tokenBalance}
              tokenLimit={50000}
              onUpgrade={() => router.push("/pricing")}
            />

            {/* Plan card */}
            <div style={{ padding: "20px 24px", borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 10 }}>현재 플랜</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: planColor[currentPlan] ?? T.muted }}>
                  {planLabel[currentPlan] ?? currentPlan}
                </div>
                {currentPlan !== "starter" && (
                  <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(63,185,80,0.15)", border: "1px solid rgba(63,185,80,0.2)", fontSize: 10, fontWeight: 700, color: T.green }}>
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
                      background: usage.metered.amount_krw >= usage.metered.warn_threshold ? "linear-gradient(90deg,#f97316,#f43f5e)" : "linear-gradient(90deg,#3fb950,#16a34a)",
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
                  {currentPlan === "starter" ? "업그레이드" : "플랜 변경"}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ padding: "20px 24px", borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 14 }}>빠른 실행</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { icon: "🆕", label: "새 프로젝트", desc: "AI와 함께 앱 생성", path: "/workspace", color: T.accent },
                  { icon: "📊", label: "사용량 확인", desc: "AI 사용 및 청구 내역", path: "/billing", color: T.blue },
                  { icon: "👥", label: "팀 관리", desc: "멤버 초대 및 권한", path: "/team", color: T.green },
                  { icon: "⚙️", label: "설정", desc: "API 키 및 계정 설정", path: "/settings", color: T.muted },
                ].map(a => (
                  <button key={a.path} onClick={() => router.push(a.path)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s", textAlign: "left", minHeight: 48, width: "100%" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = `${a.color}40`; }}
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
        </div>

      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .dashboard-main-grid { grid-template-columns: 1fr !important; }
        }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
      `}</style>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
