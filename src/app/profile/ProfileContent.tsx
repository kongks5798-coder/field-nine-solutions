"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";
import { getAuthUser, createAuthClient, type AuthUser } from "@/utils/supabase/auth";

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: T.border };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "매우 약함", color: T.red },
    { label: "약함", color: T.accent },
    { label: "보통", color: T.yellow },
    { label: "강함", color: T.green },
    { label: "매우 강함", color: "#16a34a" },
  ];
  return { score, ...map[score] };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageData {
  plan: string;
  metered?: { amount_krw: number; ai_calls: number; monthly_limit: number; hard_limit: number };
}

interface ProfileExtra {
  bio: string;
  website: string;
}

interface PublishedApp {
  slug: string;
  name: string;
  views: number;
  created_at: string;
}

interface ProfileStats {
  projects: number;
  published: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  starter: { label: "Starter", color: T.muted },
  pro: { label: "Pro 플랜", color: T.accent },
  team: { label: "Team 플랜", color: T.blue },
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return "-"; }
}

function formatMonth(iso: string | undefined): string {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }); }
  catch { return "-"; }
}

function detectProvider(user: AuthUser): string {
  const supabase = createAuthClient();
  if (supabase) {
    if (user.avatarUrl) return "OAuth (Google/GitHub/Kakao)";
    return "이메일";
  }
  return "이메일 (로컬)";
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
  fontSize: 14, color: T.text, background: T.surface, boxSizing: "border-box",
  outline: "none", transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6,
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = T.accent; };
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = T.border; };

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ projects: 0, published: 0 });
  const [publishedApps, setPublishedApps] = useState<PublishedApp[]>([]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  // Profile extra (bio/website from localStorage fallback)
  const [profileExtra, setProfileExtra] = useState<ProfileExtra>({ bio: "", website: "" });

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);

  const pwStrength = getPasswordStrength(newPw);
  const provider = user ? detectProvider(user) : "";
  const isEmailAuth = provider.includes("이메일");

  useEffect(() => {
    getAuthUser().then(u => {
      setUser(u);
      if (u) setEditName(u.name);
      setLoading(false);
    });

    fetch("/api/billing/usage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsageData(d as UsageData); })
      .catch(() => {});

    // Load profile extra from API or localStorage
    fetch("/api/user/profile")
      .then(r => r.ok ? r.json() : null)
      .then((d: { user?: { bio?: string; website?: string; username?: string }; stats?: ProfileStats } | null) => {
        if (d?.stats) setStats(d.stats);
        if (d?.user) {
          const extra = { bio: d.user.bio || "", website: d.user.website || "" };
          setProfileExtra(extra);
          setEditBio(extra.bio);
          setEditWebsite(extra.website);
          if (d.user.username) setProfileUsername(d.user.username);
        }
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem("fn_profile_extra");
          if (stored) {
            const e = JSON.parse(stored) as ProfileExtra;
            setProfileExtra(e);
            setEditBio(e.bio);
            setEditWebsite(e.website);
          }
        } catch { /* skip */ }
      });

    fetch("/api/published?user=me&limit=6")
      .then(r => r.ok ? r.json() : { apps: [] })
      .then((d: { apps: PublishedApp[] }) => { setPublishedApps(d.apps || []); })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) return;
    setNameSaving(true);

    try {
      // Save name via Supabase auth
      const supabase = createAuthClient();
      if (supabase) await supabase.auth.updateUser({ data: { name: editName.trim() } });

      // Save extra fields via API
      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: editName.trim(), bio: editBio.slice(0, 160), website: editWebsite.slice(0, 200) }),
        });
      } catch { /* skip — fallback to localStorage */ }

      // localStorage fallback
      const stored = localStorage.getItem("fn_user");
      if (stored) {
        try {
          const u = JSON.parse(stored) as Record<string, unknown>;
          u.name = editName.trim();
          localStorage.setItem("fn_user", JSON.stringify(u));
        } catch { /* skip */ }
      }
      localStorage.setItem("fn_profile_extra", JSON.stringify({ bio: editBio, website: editWebsite }));

      setUser(prev => prev ? { ...prev, name: editName.trim() } : prev);
      setProfileExtra({ bio: editBio, website: editWebsite });
      setNameSaved(true);
      setEditing(false);
      alert("프로필이 저장됐습니다");
      setTimeout(() => setNameSaved(false), 2500);
    } catch (e: unknown) {
      alert("저장 실패: " + ((e as Error).message ?? "알 수 없는 오류"));
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) { setPwMsg({ type: "err", text: "비밀번호는 6자 이상이어야 합니다." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "비밀번호가 일치하지 않습니다." }); return; }
    if (!currentPw) { setPwMsg({ type: "err", text: "현재 비밀번호를 입력해주세요." }); return; }
    setPwLoading(true);
    const supabase = createAuthClient();
    if (supabase) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user?.email || "", password: currentPw });
      if (signInErr) { setPwMsg({ type: "err", text: "현재 비밀번호가 올바르지 않습니다." }); setPwLoading(false); return; }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) { setPwMsg({ type: "err", text: "비밀번호 변경 실패: " + updateErr.message }); setPwLoading(false); return; }
    }
    setPwLoading(false);
    setPwMsg({ type: "ok", text: "비밀번호가 변경되었습니다." });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleDeleteAccount = () => {
    alert("계정 삭제 기능은 준비 중입니다. 삭제를 원하시면 support@fieldnine.com으로 연락해주세요.");
  };

  const plan = usageData?.plan || "starter";
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.starter;

  const avatarLetter = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <AppShell>
      <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, fontFamily: T.fontStack }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 4 }}>내 프로필</h1>
            <p style={{ fontSize: 14, color: T.muted }}>계정 정보를 확인하고 관리합니다.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>로딩 중...</div>
          ) : !user ? (
            <div style={cardStyle}>
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <p style={{ fontSize: 15, color: T.text, marginBottom: 16 }}>로그인이 필요합니다.</p>
                <button onClick={() => router.push("/login")} style={{
                  padding: "10px 24px", borderRadius: 8, border: "none", background: T.accent,
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>로그인하기</button>
              </div>
            </div>
          ) : (
            <>
              {/* ── A. Profile Header ──────────────────────────── */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: user.avatarUrl ? "transparent" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden",
                  }}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : avatarLetter}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 2 }}>{user.name || "이름 없음"}</div>
                    <div style={{ fontSize: 13, color: T.muted, marginBottom: 6 }}>{user.email}</div>
                    {profileExtra.bio && (
                      <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8, lineHeight: 1.5 }}>{profileExtra.bio}</div>
                    )}
                    {profileExtra.website && (
                      <a href={profileExtra.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: T.blue, textDecoration: "none", marginBottom: 8, display: "block" }}>
                        {profileExtra.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "3px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                        color: planInfo.color, background: plan === "starter" ? "rgba(107,114,128,0.15)" : `${planInfo.color}18`,
                        border: `1px solid ${planInfo.color}40`,
                      }}>{planInfo.label}</span>
                      {user.createdAt && <span style={{ fontSize: 12, color: T.muted }}>가입일: {formatDate(user.createdAt)}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <button onClick={() => setEditing(e => !e)} style={{
                      padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`,
                      background: editing ? T.accent : "transparent", color: editing ? "#fff" : T.muted,
                      fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                    }}>
                      {editing ? "편집 닫기" : "프로필 편집"}
                    </button>
                    {profileUsername && (
                      <a
                        href={`/u/${profileUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                          background: "transparent", color: T.blue, fontSize: 12, fontWeight: 600,
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        내 공개 프로필 보기 ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Edit Form ── */}
                {editing && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={labelStyle}>이름</label>
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                          placeholder="이름을 입력하세요" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                      </div>
                      <div>
                        <label style={labelStyle}>한 줄 소개 <span style={{ fontSize: 11 }}>({editBio.length}/160)</span></label>
                        <textarea value={editBio} onChange={e => setEditBio(e.target.value.slice(0, 160))}
                          placeholder="간단한 소개를 입력하세요"
                          rows={3}
                          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                          onFocus={focusIn} onBlur={focusOut} />
                      </div>
                      <div>
                        <label style={labelStyle}>웹사이트 URL</label>
                        <input type="url" value={editWebsite} onChange={e => setEditWebsite(e.target.value)}
                          placeholder="https://yoursite.com" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleSaveProfile} disabled={nameSaving}
                          style={{
                            flex: 1, padding: "11px 0", borderRadius: 9, border: "none",
                            background: nameSaved ? T.green : T.accent,
                            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                          }}>
                          {nameSaving ? "저장 중..." : nameSaved ? "저장 완료!" : "저장"}
                        </button>
                        <button onClick={() => { setEditing(false); setEditName(user.name); setEditBio(profileExtra.bio); setEditWebsite(profileExtra.website); }}
                          style={{
                            padding: "11px 20px", borderRadius: 9, border: `1px solid ${T.border}`,
                            background: "transparent", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer",
                          }}>
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── B. Stats Row ───────────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "총 프로젝트", value: `${stats.projects}개` },
                  { label: "퍼블리시된 앱", value: `${stats.published}개` },
                  { label: "이번 달 AI 사용", value: `${usageData?.metered?.ai_calls ?? 0}회` },
                  { label: "가입", value: formatMonth(user.createdAt) },
                ].map(item => (
                  <div key={item.label} style={{
                    background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px",
                  }}>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* ── C. Account Info ────────────────────────────── */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, marginBottom: 16 }}>계정 정보</h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>이메일 <span style={{ fontSize: 11, color: T.muted }}>(변경 불가)</span></label>
                  <input type="text" value={user.email} disabled style={{ ...inputStyle, color: T.muted, cursor: "not-allowed" }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>로그인 방식</label>
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
                    {provider}
                  </div>
                </div>
              </div>

              {/* ── D. Subscription ────────────────────────────── */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, marginBottom: 16 }}>구독 & 사용량</h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: "14px 16px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>현재 플랜</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: planInfo.color }}>{planInfo.label}</div>
                  </div>
                  <div style={{ padding: "14px 16px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>이번 달 AI 호출</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{usageData?.metered?.ai_calls ?? 0}회</div>
                  </div>
                </div>

                {usageData?.metered && plan !== "starter" && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted, marginBottom: 6 }}>
                      <span>사용 요금: {usageData.metered.amount_krw.toLocaleString()}원</span>
                      <span>한도: {usageData.metered.hard_limit.toLocaleString()}원</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 6 }}>
                      <div style={{
                        width: `${Math.min(100, Math.round((usageData.metered.amount_krw / usageData.metered.hard_limit) * 100))}%`,
                        height: "100%", borderRadius: 6, background: T.accent, transition: "width 0.3s",
                      }} />
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => router.push("/pricing")} style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.accent}`,
                    background: "transparent", color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>플랜 변경</button>
                  <button onClick={() => router.push("/billing")} style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: "transparent", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>결제 관리</button>
                </div>
              </div>

              {/* ── E. My Published Apps ───────────────────────── */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>내가 퍼블리시한 앱</h2>
                  <button onClick={() => router.push("/marketplace")} style={{
                    fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600,
                  }}>전체 보기 →</button>
                </div>

                {publishedApps.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: T.muted }}>
                    <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>📦</div>
                    <div style={{ fontSize: 14 }}>아직 퍼블리시된 앱이 없습니다.</div>
                    <button onClick={() => router.push("/publish")} style={{
                      marginTop: 14, padding: "8px 20px", borderRadius: 8, border: "none",
                      background: T.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>첫 앱 퍼블리시하기</button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {publishedApps.map(app => (
                      <div key={app.slug} style={{
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16,
                        display: "flex", flexDirection: "column", gap: 8,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {app.name || app.slug}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                          조회 {(app.views || 0).toLocaleString()}회
                        </div>
                        <div style={{ fontSize: 11, color: T.muted }}>{formatDate(app.created_at)}</div>
                        <a href={`/share/${app.slug}`} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "block", textAlign: "center", padding: "7px 0", borderRadius: 7,
                            border: `1px solid ${T.accent}`, color: T.accent, fontSize: 12, fontWeight: 600,
                            textDecoration: "none", transition: "all 0.15s",
                          }}>
                          열기
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── F. Security (email auth only) ─────────────── */}
              {isEmailAuth && (
                <div style={cardStyle}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, marginBottom: 16 }}>보안</h2>
                  <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={labelStyle}>현재 비밀번호</label>
                      <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                        placeholder="현재 비밀번호 입력" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    </div>
                    <div>
                      <label style={labelStyle}>새 비밀번호</label>
                      <div style={{ position: "relative" }}>
                        <input type={showNewPw ? "text" : "password"} value={newPw}
                          onChange={e => setNewPw(e.target.value)} placeholder="6자 이상"
                          style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut} />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{
                          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                          border: "none", background: "none", cursor: "pointer", fontSize: 12, color: T.muted, padding: 0,
                        }}>{showNewPw ? "숨김" : "보기"}</button>
                      </div>
                      {newPw && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} style={{
                                flex: 1, height: 3, borderRadius: 9999,
                                background: i < pwStrength.score ? pwStrength.color : "rgba(255,255,255,0.08)",
                                transition: "background 0.2s",
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: pwStrength.color, fontWeight: 500 }}>
                            비밀번호 강도: {pwStrength.label}
                            {pwStrength.score < 3 && " — 대문자, 숫자, 특수문자를 추가하면 더 안전합니다"}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>비밀번호 확인</label>
                      <div style={{ position: "relative" }}>
                        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                          placeholder="새 비밀번호 재입력"
                          style={{ ...inputStyle, paddingRight: confirmPw ? 44 : 14 }} onFocus={focusIn} onBlur={focusOut} />
                        {confirmPw && (
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                            {newPw === confirmPw ? "✅" : "❌"}
                          </span>
                        )}
                      </div>
                    </div>
                    {pwMsg && (
                      <div style={{
                        padding: "10px 14px", borderRadius: 8, fontSize: 13,
                        background: pwMsg.type === "ok" ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
                        border: `1px solid ${pwMsg.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(248,113,113,0.25)"}`,
                        color: pwMsg.type === "ok" ? T.green : T.red,
                      }}>{pwMsg.text}</div>
                    )}
                    <button type="submit" disabled={pwLoading} style={{
                      width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
                      background: pwLoading ? "rgba(107,114,128,0.3)" : T.accent,
                      color: "#fff", fontWeight: 700, fontSize: 14,
                      cursor: pwLoading ? "not-allowed" : "pointer", transition: "all 0.2s",
                    }}>{pwLoading ? "변경 중..." : "비밀번호 변경"}</button>
                  </form>
                </div>
              )}

              {/* ── G. Danger Zone ─────────────────────────────── */}
              <div style={{ ...cardStyle, borderColor: "rgba(248,113,113,0.3)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.red, margin: 0, marginBottom: 8 }}>위험 구역</h2>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>
                  삭제된 계정은 복구할 수 없습니다. 모든 데이터, 프로젝트, 구독이 영구적으로 삭제됩니다.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => router.push("/billing?cancel=true")} style={{
                    padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: "transparent", color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>구독 취소</button>
                  <button onClick={handleDeleteAccount} style={{
                    padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.4)",
                    background: "rgba(248,113,113,0.08)", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>계정 삭제</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
