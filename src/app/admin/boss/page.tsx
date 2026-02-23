"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";

/* ── Types ──────────────────────────────────────────── */

interface KPI {
  totalUsers: number;
  totalBuilds: number;
  totalAiQueries: number;
  totalTokens: number;
}

interface DeptRow {
  department: string;
  activeMembers: number;
  builds: number;
  aiQueries: number;
  lastActivity: string;
}

interface FeedItem {
  id?: string;
  user_id: string;
  user_name?: string;
  department: string;
  action_type: string;
  description?: string;
  created_at: string;
}

interface BossData {
  kpi: KPI;
  departments: DeptRow[];
  feed: FeedItem[];
}

/* ── Theme ──────────────────────────────────────────── */

const T = {
  bg: "#07080f",
  surface: "#0d1020",
  card: "#111827",
  border: "#1e293b",
  accent: "#f97316",
  text: "#e8eaf0",
  muted: "#6b7280",
  textMuted: "#9ca3af",
  green: "#22c55e",
  red: "#f87171",
  blue: "#60a5fa",
  fontStack: '"Pretendard", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const ACTION_LABELS: Record<string, string> = {
  build: "빌드",
  deploy: "배포",
  ai_query: "AI 쿼리",
  commit: "커밋",
  review: "코드 리뷰",
  login: "로그인",
  file_upload: "파일 업로드",
};

/* ── Sort helpers ───────────────────────────────────── */

type SortKey = "department" | "activeMembers" | "builds" | "aiQueries" | "lastActivity";
type SortDir = "asc" | "desc";

function compareDept(a: DeptRow, b: DeptRow, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  if (key === "department") {
    cmp = a.department.localeCompare(b.department, "ko");
  } else if (key === "lastActivity") {
    cmp = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
  } else {
    cmp = (a[key] as number) - (b[key] as number);
  }
  return dir === "asc" ? cmp : -cmp;
}

/* ── Sub-components ─────────────────────────────────── */

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={{
      background: T.card,
      borderRadius: 12,
      padding: "22px 24px",
      border: `1px solid ${T.border}`,
      boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(249,115,22,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.muted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 900,
        color: T.accent,
        letterSpacing: "-0.02em",
        fontFamily: T.fontStack,
      }}>
        {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: "12px 16px",
        textAlign: "left",
        fontSize: 11,
        fontWeight: 700,
        color: isActive ? T.accent : T.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        cursor: "pointer",
        userSelect: "none",
        borderBottom: `1px solid ${T.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label} {isActive ? (currentDir === "asc" ? " \u25B2" : " \u25BC") : ""}
    </th>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const actionLabel = ACTION_LABELS[item.action_type] ?? item.action_type;
  const timeStr = new Date(item.created_at).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}>
      {/* avatar placeholder */}
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "rgba(249,115,22,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 800,
        color: T.accent,
        flexShrink: 0,
      }}>
        {(item.user_name ?? item.user_id ?? "?").charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {item.user_name ?? item.user_id}
          <span style={{ fontWeight: 500, color: T.textMuted, marginLeft: 6 }}>
            {actionLabel}
          </span>
        </div>
        {item.description && (
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.description}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.muted, flexShrink: 0, whiteSpace: "nowrap" }}>
        {timeStr}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────── */

export default function BossDashboardPage() {
  const [data, setData] = useState<BossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("builds");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/boss/activity", { credentials: "include" });
      if (!res.ok) {
        setError("데이터를 불러올 수 없습니다");
        return;
      }
      setData(await res.json());
      setError("");
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    load();
  }, [load]);

  // 30초 자동 새로고침
  useEffect(() => {
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  // body에 dark-page 클래스 추가
  useEffect(() => {
    document.body.classList.add("dark-page");
    return () => document.body.classList.remove("dark-page");
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedDepts = data
    ? [...data.departments].sort((a, b) => compareDept(a, b, sortKey, sortDir))
    : [];

  return (
    <AppShell>
      <div style={{
        minHeight: "100vh",
        background: T.bg,
        padding: "28px 32px 60px",
        fontFamily: T.fontStack,
        color: T.text,
      }}>
        {/* ── Header ─────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: T.text }}>
              Boss Dashboard
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
              실시간 임직원 활동 모니터링 (30초 자동 갱신)
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); load(); }}
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              color: T.accent,
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: T.fontStack,
            }}
          >
            새로고침
          </button>
        </div>

        {loading && !data ? (
          <div style={{ textAlign: "center", padding: 80, color: T.muted, fontSize: 14 }}>
            데이터를 불러오는 중...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 40, color: T.red, fontSize: 14 }}>
            {error}
          </div>
        ) : data ? (
          <>
            {/* ── KPI Cards ─────────────────── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}>
              <KpiCard icon={"\uD83D\uDC65"} label="활성 사용자" value={data.kpi.totalUsers} />
              <KpiCard icon={"\uD83D\uDD28"} label="오늘 빌드" value={data.kpi.totalBuilds} />
              <KpiCard icon={"\uD83E\uDD16"} label="AI 쿼리" value={data.kpi.totalAiQueries} />
              <KpiCard icon={"\uD83D\uDCCA"} label="총 토큰 사용량" value={data.kpi.totalTokens} />
            </div>

            {/* ── 부서별 활동 테이블 ──────────── */}
            <div style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 32,
            }}>
              <div style={{ padding: "18px 22px 0" }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.text }}>
                  부서별 활동 현황
                </h2>
                <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 12px" }}>
                  최근 24시간 기준 | 컬럼 클릭으로 정렬
                </p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}>
                  <thead>
                    <tr>
                      <SortHeader label="부서명" sortKey="department" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortHeader label="활성 멤버" sortKey="activeMembers" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortHeader label="오늘 빌드" sortKey="builds" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortHeader label="AI 사용량" sortKey="aiQueries" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortHeader label="마지막 활동" sortKey="lastActivity" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDepts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 40, color: T.muted }}>
                          아직 활동 데이터가 없습니다
                        </td>
                      </tr>
                    ) : (
                      sortedDepts.map((dept, i) => (
                        <tr
                          key={dept.department}
                          style={{
                            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                          }}
                        >
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: T.text, borderBottom: `1px solid ${T.border}` }}>
                            {dept.department}
                          </td>
                          <td style={{ padding: "12px 16px", color: T.blue, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                            {dept.activeMembers}
                          </td>
                          <td style={{ padding: "12px 16px", color: T.green, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                            {dept.builds}
                          </td>
                          <td style={{ padding: "12px 16px", color: T.accent, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                            {dept.aiQueries}
                          </td>
                          <td style={{ padding: "12px 16px", color: T.muted, fontSize: 12, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                            {new Date(dept.lastActivity).toLocaleString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 실시간 활동 피드 ────────────── */}
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: 22,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: T.text }}>
                  실시간 활동 피드
                </h2>
                <span style={{ fontSize: 11, color: T.muted }}>
                  최근 20건
                </span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 10,
              }}>
                {data.feed.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>
                    아직 활동 기록이 없습니다
                  </div>
                ) : (
                  data.feed.map((item, i) => (
                    <FeedCard key={item.id ?? i} item={item} />
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
