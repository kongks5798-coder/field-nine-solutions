"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

/* ── Types ──────────────────────────────────── */

type SubAdmin = {
  id: string;
  user_id: string;
  department: string;
  permissions: string[];
  delegated_by: string;
  active: boolean;
  created_at: string;
};

type DelegationData = {
  subAdmins: SubAdmin[];
  departments: string[];
};

/* ── Helpers ────────────────────────────────── */

const fetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

const PERM_COLORS: Record<string, string> = {
  read: "#10b981",
  write: "#3b82f6",
  deploy: "#f97316",
  admin: "#ef4444",
};

const PERM_LIST = ["read", "write", "deploy", "admin"] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Component ──────────────────────────────── */

export default function DelegationPage() {
  const { data, isLoading, error: swrErr, mutate } = useSWR<DelegationData>(
    "/api/admin/delegation",
    fetcher,
  );

  const subAdmins = data?.subAdmins ?? [];
  const departments = data?.departments ?? [];

  /* ── Form State ── */
  const [formUserId, setFormUserId] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formCustomDept, setFormCustomDept] = useState("");
  const [formPerms, setFormPerms] = useState<Record<string, boolean>>({
    read: true,
    write: false,
    deploy: false,
    admin: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const togglePerm = (p: string) =>
    setFormPerms((prev) => ({ ...prev, [p]: !prev[p] }));

  const handleDelegate = useCallback(async () => {
    const dept = formDept === "__custom" ? formCustomDept.trim() : formDept;
    if (!formUserId.trim() || !dept) {
      setFormMsg("사용자 ID와 부서명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setFormMsg("");
    try {
      const perms = Object.entries(formPerms)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch("/api/admin/delegation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delegate",
          userId: formUserId.trim(),
          department: dept,
          permissions: perms.length ? perms : ["read"],
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        setFormMsg(e.error ?? "위임 실패");
      } else {
        setFormMsg("위임 완료");
        setFormUserId("");
        setFormDept("");
        setFormCustomDept("");
        setFormPerms({ read: true, write: false, deploy: false, admin: false });
        mutate();
      }
    } catch {
      setFormMsg("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }, [formUserId, formDept, formCustomDept, formPerms, mutate]);

  const handleRevoke = useCallback(
    async (userId: string, department: string) => {
      if (!confirm(`${userId} (${department}) 위임을 해제하시겠습니까?`)) return;
      try {
        await fetch("/api/admin/delegation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke", userId, department }),
        });
        mutate();
      } catch {
        /* ignore */
      }
    },
    [mutate],
  );

  /* ── Department stats ── */
  const deptStats = departments.map((d) => {
    const members = subAdmins.filter((s) => s.department === d);
    const lastActive = members.length
      ? members.reduce((a, b) =>
          a.created_at > b.created_at ? a : b,
        ).created_at
      : null;
    return { department: d, count: members.length, lastActive };
  });

  /* ── Styles ── */
  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "9px 14px",
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    fontSize: 13,
    outline: "none",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: T.gradient,
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.6 : 1,
    whiteSpace: "nowrap",
  };

  return (
    <AppShell>
      <div
        style={{
          padding: "28px 32px",
          color: T.text,
          fontFamily: T.fontStack,
          maxWidth: 1400,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>
              서브 관리자 위임 포탈
            </h1>
            <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
              부서별 관리 권한을 위임하고 관리합니다
            </p>
          </div>
          <button
            onClick={() => mutate()}
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              color: T.accent,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div style={{ color: T.muted, textAlign: "center", padding: 60 }}>
            로딩 중...
          </div>
        ) : swrErr ? (
          <div style={{ color: T.red, padding: 20 }}>데이터 로드 실패</div>
        ) : (
          <>
            {/* ── Section 1: Department Cards ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              부서별 현황
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
                marginBottom: 32,
              }}
            >
              {deptStats.length === 0 ? (
                <div
                  style={{
                    color: T.muted,
                    fontSize: 13,
                    padding: 20,
                    gridColumn: "1 / -1",
                  }}
                >
                  위임된 부서가 없습니다
                </div>
              ) : (
                deptStats.map((d) => (
                  <div
                    key={d.department}
                    style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: "18px 20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        {d.department}
                      </span>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: T.accent,
                        }}
                      >
                        {d.count}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      관리자 {d.count}명
                    </div>
                    <div
                      style={{ fontSize: 11, color: T.muted, marginTop: 4 }}
                    >
                      마지막 활동:{" "}
                      {d.lastActive ? fmtDate(d.lastActive) : "없음"}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Section 2: SubAdmin Table ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              서브 관리자 목록
            </h2>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 32,
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 2fr 1.2fr 80px",
                  padding: "10px 16px",
                  borderBottom: `1px solid ${T.border}`,
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  gap: 8,
                }}
              >
                <span>사용자 ID</span>
                <span>부서</span>
                <span>권한</span>
                <span>위임일</span>
                <span>관리</span>
              </div>

              {subAdmins.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: T.muted,
                    fontSize: 13,
                  }}
                >
                  위임된 관리자가 없습니다
                </div>
              ) : (
                subAdmins.map((sa) => (
                  <div
                    key={sa.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 2fr 1.2fr 80px",
                      padding: "12px 16px",
                      borderBottom: `1px solid ${T.border}`,
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        color: T.text,
                        fontFamily: "monospace",
                        fontSize: 11,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sa.user_id}
                    </div>
                    <div style={{ color: T.textMuted, fontSize: 12 }}>
                      {sa.department}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(sa.permissions ?? []).map((p) => (
                        <span
                          key={p}
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            background: PERM_COLORS[p] ?? T.muted,
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <div style={{ color: T.muted, fontSize: 11 }}>
                      {fmtDate(sa.created_at)}
                    </div>
                    <div>
                      <button
                        onClick={() =>
                          handleRevoke(sa.user_id, sa.department)
                        }
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: `1px solid ${T.red}`,
                          background: "rgba(248,113,113,0.1)",
                          color: T.red,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        해제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Section 3: Delegation Form ── */}
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 14,
                color: T.text,
              }}
            >
              관리자 위임
            </h2>
            <div
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "24px 24px 20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                {/* User ID */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    사용자 ID
                  </label>
                  <input
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    placeholder="위임할 사용자 ID 입력"
                    style={inputStyle}
                  />
                </div>

                {/* Department */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    부서
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "auto" as React.CSSProperties["appearance"],
                    }}
                  >
                    <option value="">부서 선택</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value="__custom">직접 입력...</option>
                  </select>
                  {formDept === "__custom" && (
                    <input
                      value={formCustomDept}
                      onChange={(e) => setFormCustomDept(e.target.value)}
                      placeholder="새 부서명 입력"
                      style={{ ...inputStyle, marginTop: 8 }}
                    />
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  권한
                </label>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {PERM_LIST.map((p) => (
                    <label
                      key={p}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        fontSize: 13,
                        color: formPerms[p] ? "#fff" : T.muted,
                        background: formPerms[p]
                          ? PERM_COLORS[p] + "22"
                          : "transparent",
                        border: `1px solid ${formPerms[p] ? PERM_COLORS[p] : T.border}`,
                        padding: "6px 12px",
                        borderRadius: 8,
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formPerms[p]}
                        onChange={() => togglePerm(p)}
                        style={{ accentColor: PERM_COLORS[p] }}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleDelegate}
                  disabled={submitting}
                  style={btnPrimary}
                >
                  {submitting ? "위임 중..." : "위임"}
                </button>
                {formMsg && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: formMsg.includes("완료") ? T.green : T.red,
                    }}
                  >
                    {formMsg}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
