"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamMembership = {
  team_id: string;
  role: string;
  teams: {
    id: string;
    name: string;
    plan: string;
    created_at: string;
    owner_id: string;
  } | null;
};

type TeamMember = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    display: "flex" as const,
    height: "calc(100vh - 56px)",
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    overflow: "hidden" as const,
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    background: "#161b22",
    borderRight: "1px solid #30363d",
    display: "flex" as const,
    flexDirection: "column" as const,
    overflow: "hidden" as const,
  },
  sidebarHeader: {
    padding: "16px",
    borderBottom: "1px solid #30363d",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#8b949e",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  createBtn: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #30363d",
    background: "#21262d",
    color: "#f97316",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  teamItem: (active: boolean) => ({
    padding: "12px 16px",
    cursor: "pointer",
    background: active ? "#1f2937" : "transparent",
    borderLeft: active ? "2px solid #f97316" : "2px solid transparent",
    transition: "all 0.12s",
  }),
  teamName: (active: boolean) => ({
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? "#e6edf3" : "#8b949e",
    marginBottom: 3,
  }),
  teamMeta: {
    fontSize: 11,
    color: "#6e7681",
  },
  main: {
    flex: 1,
    display: "flex" as const,
    flexDirection: "column" as const,
    overflow: "auto" as const,
    padding: "28px 32px",
    minWidth: 0,
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 20,
  },
  badge: (color: string, bg: string, border: string) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color,
    background: bg,
    border: `1px solid ${border}`,
    marginLeft: 8,
  }),
  memberRow: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #21262d",
  },
  avatar: (color: string) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: color,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  }),
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #30363d",
    background: "#0d1117",
    color: "#e6edf3",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  primaryBtn: (disabled?: boolean) => ({
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#21262d" : "#f97316",
    color: disabled ? "#6e7681" : "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
  }),
  dangerBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #da3633",
    background: "transparent",
    color: "#f85149",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #30363d",
    background: "#21262d",
    color: "#c9d1d9",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 1000,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  modal: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: "28px",
    width: 420,
    maxWidth: "90vw",
  },
  toast: (error: boolean) => ({
    position: "fixed" as const,
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: error ? "rgba(218,54,51,0.95)" : "rgba(35,134,54,0.95)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 99999,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  }),
};

// ─── Role colors ──────────────────────────────────────────────────────────────

function roleBadge(role: string) {
  const map: Record<string, [string, string, string]> = {
    owner: ["#f97316", "rgba(249,115,22,0.12)", "rgba(249,115,22,0.4)"],
    admin: ["#a78bfa", "rgba(167,139,250,0.12)", "rgba(167,139,250,0.4)"],
    editor: ["#58a6ff", "rgba(88,166,255,0.12)", "rgba(88,166,255,0.4)"],
    viewer: ["#8b949e", "rgba(139,148,158,0.12)", "rgba(139,148,158,0.3)"],
  };
  const [c, bg, border] = map[role] ?? map.viewer;
  return <span style={S.badge(c, bg, border)}>{role}</span>;
}

const AVATAR_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f59e0b"];
function avatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string | null | undefined, email: string) {
  if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamContent() {
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Load teams ─────────────────────────────────────────────────────────────

  const loadTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const { teams } = await res.json() as { teams: TeamMembership[] };
        setMemberships(teams ?? []);
        if (teams?.length && !selectedId) {
          const firstId = teams[0].teams?.id ?? null;
          setSelectedId(firstId);
        }
      }
    } catch {
      // graceful
    } finally {
      setLoadingTeams(false);
    }
  }, [selectedId]);

  useEffect(() => { loadTeams(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load members for selected team ─────────────────────────────────────────

  const loadMembers = useCallback(async (teamId: string) => {
    setLoadingMembers(true);
    setMembers([]);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (res.ok) {
        const { members: list } = await res.json() as { members: TeamMember[] };
        setMembers(list ?? []);
      }
    } catch {
      // graceful
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadMembers(selectedId);
  }, [selectedId, loadMembers]);

  // ─── Derived state ───────────────────────────────────────────────────────────

  const selectedMembership = memberships.find(m => m.teams?.id === selectedId);
  const selectedTeam = selectedMembership?.teams ?? null;
  const myRole = selectedMembership?.role ?? null;
  const isOwner = myRole === "owner";
  const isAdmin = myRole === "admin" || isOwner;

  // ─── Create team ─────────────────────────────────────────────────────────────

  const createTeam = async () => {
    if (!newTeamName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? "팀 생성 실패", true); return; }
      showToast(`'${newTeamName.trim()}' 팀이 생성되었습니다`);
      setNewTeamName("");
      setShowCreate(false);
      // Refresh and select new team
      const newId = json.team?.id;
      await loadTeams();
      if (newId) setSelectedId(newId);
    } catch {
      showToast("팀 생성 실패", true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Invite member ───────────────────────────────────────────────────────────

  const inviteMember = async () => {
    if (!inviteEmail.trim() || !selectedId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${selectedId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? "초대 실패", true); return; }
      showToast(json.message ?? "초대를 보냈습니다");
      setInviteEmail("");
      setInviteRole("editor");
      setShowInvite(false);
      loadMembers(selectedId);
    } catch {
      showToast("초대 실패", true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete team ─────────────────────────────────────────────────────────────

  const deleteTeam = async () => {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${selectedId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? "삭제 실패", true); return; }
      showToast("팀이 삭제되었습니다");
      setShowDeleteConfirm(false);
      setSelectedId(null);
      setMembers([]);
      await loadTeams();
    } catch {
      showToast("삭제 실패", true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div style={S.page}>

        {/* ─── Left Sidebar ─────────────────────────────── */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <span style={S.sidebarTitle}>내 팀</span>
            <button style={S.createBtn} onClick={() => setShowCreate(true)}>+ 팀 만들기</button>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {loadingTeams ? (
              <div style={{ padding: "24px 16px", color: "#6e7681", fontSize: 13, textAlign: "center" }}>
                불러오는 중...
              </div>
            ) : memberships.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>👥</div>
                <div style={{ fontSize: 13, color: "#6e7681", marginBottom: 16 }}>아직 팀이 없습니다</div>
                <button style={S.createBtn} onClick={() => setShowCreate(true)}>팀 만들기</button>
              </div>
            ) : (
              memberships.map(m => {
                if (!m.teams) return null;
                const t = m.teams;
                const active = t.id === selectedId;
                return (
                  <div
                    key={t.id}
                    style={S.teamItem(active)}
                    onClick={() => setSelectedId(t.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setSelectedId(t.id); }}
                  >
                    <div style={S.teamName(active)}>{t.name}</div>
                    <div style={S.teamMeta}>
                      {m.role === "owner" ? "오너" : m.role === "admin" ? "관리자" : m.role === "editor" ? "에디터" : "뷰어"}
                      {" · "}
                      <span style={{ textTransform: "capitalize" }}>{t.plan}</span> 플랜
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Main Content ─────────────────────────────── */}
        <div style={S.main}>
          {!selectedTeam ? (
            /* Empty state */
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, height: "100%" }}>
              <div style={{ fontSize: 64, opacity: 0.2 }}>👥</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e6edf3" }}>팀을 선택하거나 만들어보세요</div>
              <div style={{ fontSize: 14, color: "#6e7681", textAlign: "center", maxWidth: 360 }}>
                팀을 만들면 멤버를 초대하고 함께 프로젝트를 관리할 수 있습니다.
              </div>
              <button style={{ ...S.primaryBtn(), marginTop: 8 }} onClick={() => setShowCreate(true)}>
                팀 만들기 →
              </button>
            </div>
          ) : (
            <>
              {/* Team header */}
              <div style={S.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e6edf3" }}>{selectedTeam.name}</h1>
                      {roleBadge(myRole ?? "viewer")}
                      <span style={S.badge("#58a6ff", "rgba(88,166,255,0.1)", "rgba(88,166,255,0.3)")}>
                        {selectedTeam.plan.charAt(0).toUpperCase() + selectedTeam.plan.slice(1)} 플랜
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#6e7681" }}>
                      생성일: {new Date(selectedTeam.created_at).toLocaleDateString("ko-KR")}
                      {" · "}
                      멤버 {members.length}명
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {isAdmin && (
                      <button style={S.secondaryBtn} onClick={() => setShowInvite(true)}>
                        멤버 초대
                      </button>
                    )}
                    {isOwner && (
                      <button style={S.dangerBtn} onClick={() => setShowDeleteConfirm(true)}>
                        팀 삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Members list */}
              <div style={S.card}>
                <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#e6edf3" }}>
                  멤버 {loadingMembers ? "..." : `(${members.length})`}
                </h2>

                {loadingMembers ? (
                  <div style={{ color: "#6e7681", fontSize: 13, padding: "16px 0" }}>멤버 불러오는 중...</div>
                ) : members.length === 0 ? (
                  <div style={{ color: "#6e7681", fontSize: 13, padding: "16px 0" }}>
                    멤버가 없습니다. 초대해보세요!
                  </div>
                ) : (
                  members.map((member, i) => {
                    const profile = member.profiles;
                    const email = profile?.email ?? "unknown@example.com";
                    const name = profile?.full_name ?? null;
                    const color = avatarColor(member.user_id);
                    const isLast = i === members.length - 1;
                    return (
                      <div key={member.user_id} style={{ ...S.memberRow, borderBottom: isLast ? "none" : "1px solid #21262d" }}>
                        <div style={S.avatar(color)}>
                          {initials(name, email)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name ?? email}
                          </div>
                          {name && (
                            <div style={{ fontSize: 12, color: "#6e7681" }}>{email}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {roleBadge(member.role)}
                          <div style={{ fontSize: 11, color: "#6e7681" }}>
                            {new Date(member.joined_at).toLocaleDateString("ko-KR")} 가입
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick actions */}
              <div style={{ ...S.card, background: "#0d1117", border: "1px solid #21262d" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6e7681", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  팀 정보
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "팀 ID", value: selectedTeam.id.slice(0, 8) + "..." },
                    { label: "플랜", value: selectedTeam.plan.charAt(0).toUpperCase() + selectedTeam.plan.slice(1) },
                    { label: "내 역할", value: myRole ?? "-" },
                    { label: "총 멤버", value: `${members.length}명` },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#161b22", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#6e7681", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e6edf3" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Create Team Modal ────────────────────────── */}
        {showCreate && (
          <div style={S.modalOverlay} onClick={() => setShowCreate(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>새 팀 만들기</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8b949e", marginBottom: 6 }}>팀 이름</label>
                <input
                  style={S.input}
                  placeholder="예: 프론트엔드 팀"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") createTeam(); }}
                  autoFocus
                  maxLength={50}
                />
                <div style={{ fontSize: 11, color: "#6e7681", marginTop: 4 }}>{newTeamName.length}/50</div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={S.secondaryBtn} onClick={() => { setShowCreate(false); setNewTeamName(""); }}>취소</button>
                <button style={S.primaryBtn(!newTeamName.trim() || submitting)} onClick={createTeam} disabled={!newTeamName.trim() || submitting}>
                  {submitting ? "생성 중..." : "팀 만들기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Invite Member Modal ──────────────────────── */}
        {showInvite && (
          <div style={S.modalOverlay} onClick={() => setShowInvite(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#e6edf3" }}>멤버 초대</h2>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8b949e", marginBottom: 6 }}>이메일</label>
                <input
                  style={S.input}
                  type="email"
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#8b949e", marginBottom: 6 }}>역할</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{ ...S.input, cursor: "pointer" }}
                >
                  <option value="admin">Admin — 멤버 관리 가능</option>
                  <option value="editor">Editor — 편집 가능</option>
                  <option value="viewer">Viewer — 읽기만 가능</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={S.secondaryBtn} onClick={() => { setShowInvite(false); setInviteEmail(""); }}>취소</button>
                <button style={S.primaryBtn(!inviteEmail.trim() || submitting)} onClick={inviteMember} disabled={!inviteEmail.trim() || submitting}>
                  {submitting ? "초대 중..." : "초대 보내기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Delete Confirm Modal ─────────────────────── */}
        {showDeleteConfirm && (
          <div style={S.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: "#f85149" }}>팀 삭제</h2>
              <p style={{ fontSize: 14, color: "#8b949e", lineHeight: 1.6, marginBottom: 20 }}>
                <strong style={{ color: "#e6edf3" }}>{selectedTeam?.name}</strong> 팀을 삭제하시겠습니까?
                <br />이 작업은 되돌릴 수 없으며, 모든 멤버와 설정이 삭제됩니다.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button style={S.secondaryBtn} onClick={() => setShowDeleteConfirm(false)}>취소</button>
                <button
                  style={{ ...S.primaryBtn(submitting), background: submitting ? "#21262d" : "#da3633" }}
                  onClick={deleteTeam}
                  disabled={submitting}
                >
                  {submitting ? "삭제 중..." : "팀 삭제"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div style={S.toast(toast.error)}>{toast.msg}</div>
      )}
    </AppShell>
  );
}
