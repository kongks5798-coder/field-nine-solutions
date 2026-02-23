"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

/* ── 타입 ── */
type RoleDef = {
  id: string;
  name: string;
  permissions: string[];
  description: string | null;
};
type UserRoleRow = {
  user_id: string;
  org_id: string | null;
  granted_at: string;
  roles: { name: string; permissions: string[]; description: string | null };
};

/* ── 역할 배지 색상 ── */
const ROLE_COLORS: Record<string, string> = {
  owner: "#f97316",
  admin: "#ef4444",
  manager: "#3b82f6",
  developer: "#10b981",
  viewer: "#6b7280",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  developer: "Developer",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "전체 시스템 소유자. 모든 권한 보유",
  admin: "관리자. 배포/빌링 제외 전체 권한",
  manager: "매니저. 읽기/쓰기/위임 권한",
  developer: "개발자. 읽기/쓰기/배포 권한",
  viewer: "뷰어. 읽기 전용",
};

const ROLE_PERMS: Record<string, string[]> = {
  owner: ["read", "write", "deploy", "admin", "billing", "delegate"],
  admin: ["read", "write", "deploy", "admin", "delegate"],
  manager: ["read", "write", "delegate"],
  developer: ["read", "write", "deploy"],
  viewer: ["read"],
};

/* ── Fetcher ── */
const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

export default function AdminRbacPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/rbac", fetcher);

  /* 역할 할당 폼 상태 */
  const [formUserId, setFormUserId] = useState("");
  const [formRole, setFormRole] = useState("viewer");
  const [formOrgId, setFormOrgId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function handleAssign() {
    if (!formUserId.trim()) {
      setFeedback({ type: "err", msg: "User ID를 입력하세요." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/rbac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign",
          userId: formUserId.trim(),
          roleName: formRole,
          orgId: formOrgId.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setFeedback({ type: "ok", msg: `${formRole} 역할이 할당되었습니다.` });
      setFormUserId("");
      setFormOrgId("");
      mutate();
    } catch (e: unknown) {
      setFeedback({ type: "err", msg: e instanceof Error ? e.message : "할당 실패" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(userId: string, roleName: string, orgId: string | null) {
    if (!confirm(`${userId}에서 ${roleName} 역할을 해제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/admin/rbac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", userId, roleName, orgId }),
      });
      if (!res.ok) throw new Error(await res.text());
      mutate();
    } catch {
      alert("역할 해제에 실패했습니다.");
    }
  }

  const userRoles: UserRoleRow[] = data?.userRoles ?? [];
  const roleList = ["owner", "admin", "manager", "developer", "viewer"];

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        {/* ── 헤더 ── */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 6 }}>
          RBAC 역할 관리
        </h1>
        <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 32 }}>
          Enterprise Role-Based Access Control 시스템
        </p>

        {/* ── 역할 카드 5개 ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 36,
          }}
        >
          {roleList.map((rn) => (
            <div
              key={rn}
              style={{
                background: T.card,
                borderRadius: 12,
                padding: "18px 16px",
                border: `1px solid ${ROLE_COLORS[rn]}33`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: ROLE_COLORS[rn],
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, color: ROLE_COLORS[rn] }}>
                  {ROLE_LABELS[rn]}
                </span>
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.4 }}>
                {ROLE_DESCRIPTIONS[rn]}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ROLE_PERMS[rn].map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 6,
                      background: `${ROLE_COLORS[rn]}22`,
                      color: ROLE_COLORS[rn],
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── 사용자별 역할 테이블 ── */}
        <div
          style={{
            background: T.card,
            borderRadius: 12,
            padding: "20px 18px",
            marginBottom: 32,
            overflowX: "auto",
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            사용자 역할 목록
          </h2>

          {isLoading && (
            <p style={{ color: T.textMuted, fontSize: 13 }}>불러오는 중...</p>
          )}
          {error && (
            <p style={{ color: T.red, fontSize: 13 }}>데이터를 불러올 수 없습니다.</p>
          )}

          {!isLoading && !error && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                color: T.text,
              }}
            >
              <thead>
                <tr>
                  {["User ID", "역할", "조직 ID", "할당일", "액션"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        borderBottom: `1px solid ${T.border}`,
                        color: T.textMuted,
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userRoles.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: 20, textAlign: "center", color: T.textMuted }}
                    >
                      역할이 할당된 사용자가 없습니다.
                    </td>
                  </tr>
                )}
                {userRoles.map((ur, i) => {
                  const rn = ur.roles?.name ?? "unknown";
                  return (
                    <tr
                      key={`${ur.user_id}-${rn}-${i}`}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      <td style={{ padding: "10px 10px", fontFamily: "monospace", fontSize: 12 }}>
                        {ur.user_id.slice(0, 12)}...
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            background: `${ROLE_COLORS[rn] ?? T.muted}22`,
                            color: ROLE_COLORS[rn] ?? T.muted,
                          }}
                        >
                          {rn}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          fontFamily: "monospace",
                          fontSize: 12,
                          color: ur.org_id ? T.text : T.muted,
                        }}
                      >
                        {ur.org_id ? ur.org_id.slice(0, 10) + "..." : "—"}
                      </td>
                      <td style={{ padding: "10px 10px", fontSize: 12, color: T.textMuted }}>
                        {ur.granted_at
                          ? new Date(ur.granted_at).toLocaleDateString("ko-KR")
                          : "—"}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <button
                          onClick={() => handleRevoke(ur.user_id, rn, ur.org_id)}
                          style={{
                            background: `${T.red}22`,
                            color: T.red,
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          해제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 역할 할당 폼 ── */}
        <div
          style={{
            background: T.card,
            borderRadius: 12,
            padding: "24px 20px",
            border: `1px solid ${T.border}`,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            역할 할당
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            {/* User ID */}
            <div>
              <label
                style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}
              >
                User ID
              </label>
              <input
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                placeholder="사용자 UUID"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.text,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Role Select */}
            <div>
              <label
                style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}
              >
                역할
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.text,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                {roleList.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Org ID (optional) */}
            <div>
              <label
                style={{ fontSize: 11, color: T.textMuted, display: "block", marginBottom: 4 }}
              >
                조직 ID (선택)
              </label>
              <input
                value={formOrgId}
                onChange={(e) => setFormOrgId(e.target.value)}
                placeholder="org UUID (선택)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.surface,
                  color: T.text,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAssign}
              disabled={submitting}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: T.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {submitting ? "처리 중..." : "할당"}
            </button>
          </div>

          {/* 피드백 */}
          {feedback && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: feedback.type === "ok" ? T.green : T.red,
              }}
            >
              {feedback.msg}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
