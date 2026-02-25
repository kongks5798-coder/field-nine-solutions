"use client";

import React, { useState, useEffect, useCallback } from "react";
import { T } from "./workspace.constants";
import type {
  TeamRole,
  TeamMember,
  TeamProject,
} from "./ai/teamRbac";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TeamManagementPanelProps {
  onClose: () => void;
}

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: "admin", label: "\uAD00\uB9AC\uC790" },
  { value: "editor", label: "\uD3B8\uC9D1\uC790" },
  { value: "viewer", label: "\uBDF0\uC5B4" },
];

// ── Main Component ──────────────────────────────────────────────────────────────

export function TeamManagementPanel({ onClose }: TeamManagementPanelProps) {
  const [project, setProject] = useState<TeamProject | null>(null);
  const [currentRole, setCurrentRole] = useState<TeamRole>("owner");
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("editor");
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Permissions info
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionsData, setPermissionsData] = useState<Record<string, string[]>>({});

  // Load team project
  useEffect(() => {
    import("./ai/teamRbac").then(mod => {
      let loaded = mod.loadTeamProject();
      if (!loaded) {
        // Create default project for demo
        loaded = mod.createTeamProject("\uB0B4 \uD504\uB85C\uC81D\uD2B8", {
          id: "user_1",
          email: "me@fieldnine.io",
          name: "\uB098",
        });
      }
      setProject(loaded);
      // Determine current user's role (assume first member is current user)
      const me = loaded.members[0];
      if (me) setCurrentRole(me.role);

      // Load permissions info
      const roles: TeamRole[] = ["owner", "admin", "editor", "viewer"];
      const permsMap: Record<string, string[]> = {};
      roles.forEach(r => {
        permsMap[r] = mod.getPermissionsForRole(r);
      });
      setPermissionsData(permsMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Invite member
  const handleInvite = useCallback(async () => {
    if (!project || !inviteEmail.trim() || !inviteName.trim()) return;
    const mod = await import("./ai/teamRbac");
    const newMember: Omit<TeamMember, "joinedAt" | "lastActiveAt"> = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      role: inviteRole,
    };
    const updated = mod.addTeamMember(project, newMember, currentRole);
    if (updated) {
      setProject(updated);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("editor");
      setShowInviteForm(false);
    }
  }, [project, inviteEmail, inviteName, inviteRole, currentRole]);

  // Remove member
  const handleRemove = useCallback(async (memberId: string) => {
    if (!project) return;
    const mod = await import("./ai/teamRbac");
    const updated = mod.removeTeamMember(project, memberId, currentRole);
    if (updated) setProject(updated);
  }, [project, currentRole]);

  // Change role
  const handleChangeRole = useCallback(async (memberId: string, newRole: TeamRole) => {
    if (!project) return;
    const mod = await import("./ai/teamRbac");
    const updated = mod.changeRole(project, memberId, newRole, currentRole);
    if (updated) setProject(updated);
  }, [project, currentRole]);

  // Helper: get role color
  const getRoleColor = (role: TeamRole): string => {
    const colors: Record<TeamRole, string> = {
      owner: "#f59e0b",
      admin: "#8b5cf6",
      editor: "#3b82f6",
      viewer: "#6b7280",
    };
    return colors[role];
  };

  // Helper: get role label
  const getRoleLabel = (role: TeamRole): string => {
    const labels: Record<TeamRole, string> = {
      owner: "\uC18C\uC720\uC790",
      admin: "\uAD00\uB9AC\uC790",
      editor: "\uD3B8\uC9D1\uC790",
      viewer: "\uBDF0\uC5B4",
    };
    return labels[role];
  };

  // Helper: permission label
  const getPermLabel = (perm: string): string => {
    const map: Record<string, string> = {
      "project:delete": "\uD504\uB85C\uC81D\uD2B8 \uC0AD\uC81C",
      "project:settings": "\uD504\uB85C\uC81D\uD2B8 \uC124\uC815",
      "project:transfer": "\uD504\uB85C\uC81D\uD2B8 \uC774\uC804",
      "member:invite": "\uBA64\uBC84 \uCD08\uB300",
      "member:remove": "\uBA64\uBC84 \uC81C\uAC70",
      "member:changeRole": "\uC5ED\uD560 \uBCC0\uACBD",
      "file:create": "\uD30C\uC77C \uC0DD\uC131",
      "file:edit": "\uD30C\uC77C \uD3B8\uC9D1",
      "file:delete": "\uD30C\uC77C \uC0AD\uC81C",
      "deploy:create": "\uBC30\uD3EC \uC0DD\uC131",
      "deploy:rollback": "\uBC30\uD3EC \uB864\uBC31",
      "git:push": "Git \uD478\uC2DC",
      "git:branch": "Git \uBE0C\uB79C\uCE58",
      "git:merge": "Git \uBA38\uC9C0",
      "ai:generate": "AI \uC0DD\uC131",
      "ai:autonomous": "AI \uC790\uC728 \uBAA8\uB4DC",
      "secrets:manage": "\uC2DC\uD06C\uB9BF \uAD00\uB9AC",
    };
    return map[perm] || perm;
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 420, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="5" r="2.5"/>
            <path d="M1 13c0-2.21 2.24-4 5-4s5 1.79 5 4"/>
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 9c1.66 0 3 1.12 3 2.5"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{"\uD300 \uAD00\uB9AC"}</span>
          {project && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.accent,
              background: `${T.accent}15`, padding: "2px 7px", borderRadius: 8,
            }}>{project.members.length}{"\uBA85"}</span>
          )}
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            {"\uB85C\uB529 \uC911..."}
          </div>
        ) : !project ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            {"\uD300 \uD504\uB85C\uC81D\uD2B8\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}
          </div>
        ) : (
          <>
            {/* Project Info */}
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: `${T.accent}06`, border: `1px solid ${T.borderHi || T.border}`,
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{project.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>
                {"\uC0DD\uC131\uC77C"}: {new Date(project.createdAt).toLocaleDateString("ko-KR")} · {project.members.length}{"\uBA85\uC758 \uBA64\uBC84"}
              </div>
            </div>

            {/* Members List */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{"\uBA64\uBC84"}</span>
                {(currentRole === "owner" || currentRole === "admin") && (
                  <button onClick={() => setShowInviteForm(!showInviteForm)}
                    style={{
                      padding: "3px 10px", borderRadius: 5,
                      border: `1px solid ${T.accent}`,
                      background: `${T.accent}10`,
                      color: T.accent, fontSize: 10, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    + {"\uCD08\uB300"}
                  </button>
                )}
              </div>

              {/* Invite Form */}
              {showInviteForm && (
                <div style={{
                  padding: "10px 12px", borderRadius: 8,
                  border: `1px solid ${T.accent}30`,
                  background: `${T.accent}05`,
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>{"\uBA64\uBC84 \uCD08\uB300"}</div>
                  <input
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder={"\uC774\uB984"}
                    style={{
                      width: "100%", padding: "6px 8px", background: "#f3f4f6",
                      border: `1px solid ${T.border}`, borderRadius: 6, color: T.text,
                      fontSize: 11, outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box", marginBottom: 6,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                  />
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder={"\uC774\uBA54\uC77C"}
                    type="email"
                    style={{
                      width: "100%", padding: "6px 8px", background: "#f3f4f6",
                      border: `1px solid ${T.border}`, borderRadius: 6, color: T.text,
                      fontSize: 11, outline: "none", fontFamily: "inherit",
                      boxSizing: "border-box", marginBottom: 6,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                  />
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {ROLE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setInviteRole(opt.value)}
                        style={{
                          flex: 1, padding: "5px 0", borderRadius: 5,
                          border: `1px solid ${inviteRole === opt.value ? getRoleColor(opt.value) : T.border}`,
                          background: inviteRole === opt.value ? `${getRoleColor(opt.value)}15` : "#f9fafb",
                          color: inviteRole === opt.value ? getRoleColor(opt.value) : T.muted,
                          fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={handleInvite}
                      disabled={!inviteEmail.trim() || !inviteName.trim()}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
                        background: (!inviteEmail.trim() || !inviteName.trim())
                          ? "#d1d5db"
                          : `linear-gradient(135deg, ${T.accent}, ${T.accentB || T.accent})`,
                        color: "#fff", fontSize: 11, fontWeight: 700,
                        cursor: (!inviteEmail.trim() || !inviteName.trim()) ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}>
                      {"\uCD08\uB300\uD558\uAE30"}
                    </button>
                    <button onClick={() => setShowInviteForm(false)}
                      style={{
                        padding: "7px 14px", borderRadius: 6,
                        border: `1px solid ${T.border}`, background: "#f9fafb",
                        color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {"\uCDE8\uC18C"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {project.members.map(member => (
                  <div key={member.id} style={{
                    padding: "8px 10px", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: "#f9fafb",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: `${getRoleColor(member.role)}20`,
                      color: getRoleColor(member.role),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 9, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.email}
                      </div>
                    </div>
                    {/* Role badge */}
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 5,
                      background: `${getRoleColor(member.role)}15`,
                      color: getRoleColor(member.role),
                      border: `1px solid ${getRoleColor(member.role)}30`,
                      flexShrink: 0,
                    }}>
                      {getRoleLabel(member.role)}
                    </span>
                    {/* Actions (only for non-owners, and if current user has permission) */}
                    {member.role !== "owner" && (currentRole === "owner" || currentRole === "admin") && (
                      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                        {/* Role change dropdown */}
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value as TeamRole)}
                          style={{
                            padding: "2px 4px", borderRadius: 4,
                            border: `1px solid ${T.border}`, background: "#fff",
                            color: T.text, fontSize: 9, cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {currentRole === "owner" && <option value="admin">{"\uAD00\uB9AC\uC790"}</option>}
                          <option value="editor">{"\uD3B8\uC9D1\uC790"}</option>
                          <option value="viewer">{"\uBDF0\uC5B4"}</option>
                        </select>
                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(member.id)}
                          style={{
                            width: 22, height: 22, borderRadius: 4,
                            border: "1px solid #ef444440", background: "#fff",
                            color: "#ef4444", cursor: "pointer", fontSize: 9,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          title={"\uBA64\uBC84 \uC81C\uAC70"}
                        >
                          {"\u2715"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Role Permissions Info */}
            <div style={{ marginBottom: 14 }}>
              <button onClick={() => setShowPermissions(!showPermissions)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: showPermissions ? `${T.accent}06` : "#f9fafb",
                  color: T.text, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                <span>{"\uC5ED\uD560\uBCC4 \uAD8C\uD55C \uC815\uBCF4"}</span>
                <span style={{ fontSize: 10, color: T.muted }}>{showPermissions ? "\u25B2" : "\u25BC"}</span>
              </button>

              {showPermissions && (
                <div style={{
                  marginTop: 8, padding: "12px 14px", borderRadius: 10,
                  border: `1px solid ${T.border}`, background: "#f9fafb",
                }}>
                  {(["owner", "admin", "editor", "viewer"] as TeamRole[]).map(role => (
                    <div key={role} style={{ marginBottom: role === "viewer" ? 0 : 12 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                          background: `${getRoleColor(role)}15`,
                          color: getRoleColor(role),
                        }}>
                          {getRoleLabel(role)}
                        </span>
                      </div>
                      {permissionsData[role] && permissionsData[role].length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginLeft: 2 }}>
                          {permissionsData[role].map(perm => (
                            <span key={perm} style={{
                              fontSize: 8, padding: "1px 5px", borderRadius: 3,
                              background: "#e5e7eb", color: "#4b5563",
                            }}>
                              {getPermLabel(perm)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 9, color: T.muted, marginLeft: 2 }}>
                          {"\uC77D\uAE30 \uC804\uC6A9 (\uD30C\uC77C \uBCF4\uAE30, \uD504\uB9AC\uBDF0, Git \uAE30\uB85D)"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
