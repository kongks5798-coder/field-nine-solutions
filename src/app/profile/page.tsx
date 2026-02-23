"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";
import { getAuthUser, createAuthClient, type AuthUser } from "@/utils/supabase/auth";

// ─── Password strength (reused from signup) ──────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface UsageData {
  plan: string;
  metered?: { amount_krw: number; ai_calls: number; monthly_limit: number; hard_limit: number };
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

function detectProvider(user: AuthUser): string {
  const supabase = createAuthClient();
  if (supabase) {
    if (user.avatarUrl) return "OAuth (Google/GitHub/Kakao)";
    return "이메일";
  }
  return "이메일 (로컬)";
}

// ─── Shared styles ───────────────────────────────────────────────────────────

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

const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = T.accent; };
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = T.border; };

// ─── Main component ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [editName, setEditName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
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
    getAuthUser().then(u => { setUser(u); if (u) setEditName(u.name); setLoading(false); });
    fetch("/api/billing/usage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsageData(d as UsageData); })
      .catch(() => {});
  }, []);

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim().length < 2) return;
    setNameSaving(true);
    const supabase = createAuthClient();
    if (supabase) await supabase.auth.updateUser({ data: { name: editName.trim() } });
    const stored = localStorage.getItem("fn_user");
    if (stored) {
      try {
        const u = JSON.parse(stored) as Record<string, unknown>;
        u.name = editName.trim();
        localStorage.setItem("fn_user", JSON.stringify(u));
      } catch { /* skip */ }
    }
    setUser(prev => prev ? { ...prev, name: editName.trim() } : prev);
    setNameSaving(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
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

  return (
    <AppShell>
      <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, fontFamily: '"Pretendard", Inter, -apple-system, sans-serif' }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 4 }}>{user.name || "이름 없음"}</div>
                    <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>{user.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "3px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
                        color: planInfo.color, background: plan === "starter" ? "rgba(107,114,128,0.15)" : `${planInfo.color}18`,
                        border: `1px solid ${planInfo.color}40`,
                      }}>{planInfo.label}</span>
                      {user.createdAt && <span style={{ fontSize: 12, color: T.muted }}>가입일: {formatDate(user.createdAt)}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── B. Account Info ────────────────────────────── */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0, marginBottom: 16 }}>계정 정보</h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>이메일 <span style={{ fontSize: 11, color: T.muted }}>(변경 불가)</span></label>
                  <input type="text" value={user.email} disabled style={{ ...inputStyle, color: T.muted, cursor: "not-allowed" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>이름</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    placeholder="이름을 입력하세요" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>로그인 방식</label>
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}>
                    {provider}
                  </div>
                </div>

                <button onClick={handleSaveName}
                  disabled={nameSaving || !editName.trim() || editName.trim() === user.name}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
                    background: nameSaved ? T.green : (editName.trim() && editName.trim() !== user.name) ? T.accent : "rgba(107,114,128,0.3)",
                    color: "#fff", fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                    cursor: (editName.trim() && editName.trim() !== user.name) ? "pointer" : "not-allowed",
                    opacity: (!editName.trim() || editName.trim() === user.name) ? 0.5 : 1,
                  }}>
                  {nameSaving ? "저장 중..." : nameSaved ? "저장 완료!" : "이름 저장"}
                </button>
              </div>

              {/* ── C. Subscription ────────────────────────────── */}
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

              {/* ── D. Security (email auth only) ─────────────── */}
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
                            {pwStrength.score < 3 && " -- 대문자, 숫자, 특수문자를 추가하면 더 안전합니다"}
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

              {/* ── E. Danger Zone ─────────────────────────────── */}
              <div style={{ ...cardStyle, borderColor: "rgba(248,113,113,0.3)" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.red, margin: 0, marginBottom: 8 }}>위험 구역</h2>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>
                  삭제된 계정은 복구할 수 없습니다. 모든 데이터, 프로젝트, 구독이 영구적으로 삭제됩니다.
                </p>
                <button onClick={handleDeleteAccount} style={{
                  padding: "10px 24px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.4)",
                  background: "rgba(248,113,113,0.08)", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>계정 삭제</button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
