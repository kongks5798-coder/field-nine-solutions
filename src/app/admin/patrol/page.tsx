"use client";

import { useEffect, useState, useCallback } from "react";
import { T } from "@/lib/theme";
import {
  PATROL_AGENTS,
  PATROL_TEAMS,
  getTeamAgents,
  type PatrolTeam,
  type PatrolAgent,
  type PatrolTeamMeta,
} from "@/lib/patrol-agents";

/* ── Types ──────────────────────────────────────────── */

interface TeamMetric {
  label: string;
  value: string;
  status: "pass" | "warning" | "fail";
}

interface TeamStatus {
  team: PatrolTeam;
  status: "pass" | "warning" | "fail";
  lastRun: string | null;
  metrics: TeamMetric[];
}

interface PatrolStatusResponse {
  lastRun: string;
  teams: TeamStatus[];
  summary: string;
}

interface PatrolLogEntry {
  timestamp: string;
  team: PatrolTeam;
  message: string;
  status: "pass" | "warning" | "fail";
}

/* ── Constants ──────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pass:    { label: "PASS",    color: T.green,  bg: "rgba(34,197,94,0.12)" },
  warning: { label: "WARNING", color: T.yellow, bg: "rgba(251,191,36,0.12)" },
  fail:    { label: "FAIL",    color: T.red,    bg: "rgba(248,113,113,0.12)" },
};

/* ── Sub-components ─────────────────────────────────── */

function StatusBadge({ status }: { status: "pass" | "warning" | "fail" }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {status === "pass" ? "✅" : status === "warning" ? "⚠️" : "❌"} {cfg.label}
    </span>
  );
}

function AgentRow({ agent }: { agent: PatrolAgent }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 18 }}>{agent.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {agent.nameKo} <span style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>({agent.name})</span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
          {agent.role}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: TeamMetric }) {
  const cfg = STATUS_CONFIG[metric.status];
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 12, color: T.muted }}>{metric.label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{metric.value}</span>
    </div>
  );
}

function TeamCard({ teamMeta, teamStatus }: { teamMeta: PatrolTeamMeta; teamStatus: TeamStatus | undefined }) {
  const agents = getTeamAgents(teamMeta.id);

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Team header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
            {teamMeta.emoji} {teamMeta.name}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
            {teamMeta.nameKo} | {teamMeta.description}
          </div>
        </div>
        {teamStatus && <StatusBadge status={teamStatus.status} />}
      </div>

      {/* Agents */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          color: T.muted,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          순찰 요원
        </div>
        {agents.map(agent => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Metrics */}
      {teamStatus && teamStatus.metrics.length > 0 && (
        <div>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.muted,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 6,
          }}>
            주요 지표
          </div>
          {teamStatus.metrics.map((m, i) => (
            <MetricRow key={i} metric={m} />
          ))}
        </div>
      )}

      {/* Last run */}
      <div style={{
        fontSize: 11,
        color: T.muted,
        borderTop: `1px solid ${T.border}`,
        paddingTop: 12,
      }}>
        마지막 순찰: {teamStatus?.lastRun
          ? new Date(teamStatus.lastRun).toLocaleString("ko-KR")
          : "기록 없음"}
      </div>
    </div>
  );
}

function LogEntry({ entry }: { entry: PatrolLogEntry }) {
  const cfg = STATUS_CONFIG[entry.status];
  const teamMeta = PATROL_TEAMS.find(t => t.id === entry.team);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "10px 14px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{teamMeta?.emoji ?? "📋"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
          {entry.message}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {teamMeta?.name ?? entry.team} | {new Date(entry.timestamp).toLocaleString("ko-KR")}
        </div>
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        padding: "2px 8px",
        borderRadius: 4,
        flexShrink: 0,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────── */

export default function AdminPatrolPage() {
  const [status, setStatus] = useState<PatrolStatusResponse | null>(null);
  const [logs, setLogs] = useState<PatrolLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/patrol/status", { credentials: "include" });
      if (!r.ok) {
        setError("순찰 상태 로드 실패");
        return;
      }
      const data = await r.json();
      setStatus(data.status);
      setLogs(data.logs ?? []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Calculate overall status
  const overallStatus = status?.teams
    ? status.teams.some(t => t.status === "fail")
      ? "fail"
      : status.teams.some(t => t.status === "warning")
        ? "warning"
        : "pass"
    : null;

  const overallLabel = overallStatus === "pass"
    ? "ALL CLEAR"
    : overallStatus === "warning"
      ? "ATTENTION"
      : overallStatus === "fail"
        ? "ACTION REQUIRED"
        : "대기 중";

  return (
    <div style={{
      padding: "28px 32px",
      color: T.text,
      fontFamily: '"Pretendard", Inter, sans-serif',
      maxWidth: 1200,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>
            {"🛡️"} 순찰 에이전트 대시보드
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
            {PATROL_AGENTS.length}명의 순찰 요원이 {PATROL_TEAMS.length}개 팀으로 플랫폼을 보호합니다
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {overallStatus && (
            <div style={{
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              color: STATUS_CONFIG[overallStatus].color,
              background: STATUS_CONFIG[overallStatus].bg,
              border: `1px solid ${STATUS_CONFIG[overallStatus].color}33`,
            }}>
              {overallLabel}
            </div>
          )}
          <button onClick={load} style={{
            background: "rgba(249,115,22,0.1)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            color: T.accent,
            cursor: "pointer",
            fontWeight: 600,
          }}>
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: 60 }}>
          순찰 상태 확인 중...
        </div>
      ) : error ? (
        <div style={{ color: T.red, fontSize: 14, padding: 20 }}>{error}</div>
      ) : (
        <>
          {/* Summary bar */}
          {status && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}>
              <div style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}>
                <div style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  총 에이전트
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.accent, letterSpacing: "-0.02em" }}>
                  {PATROL_AGENTS.length}
                </div>
              </div>
              <div style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}>
                <div style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  팀 수
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.blue, letterSpacing: "-0.02em" }}>
                  {PATROL_TEAMS.length}
                </div>
              </div>
              <div style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}>
                <div style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  마지막 순찰
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 6 }}>
                  {status.lastRun
                    ? new Date(status.lastRun).toLocaleString("ko-KR")
                    : "기록 없음"}
                </div>
              </div>
              <div style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}>
                <div style={{
                  fontSize: 11,
                  color: T.muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  종합 판정
                </div>
                <div style={{ marginTop: 4 }}>
                  {overallStatus && <StatusBadge status={overallStatus} />}
                </div>
              </div>
            </div>
          )}

          {/* Team Cards — 3 columns */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}>
            {PATROL_TEAMS.map(teamMeta => {
              const teamStatus = status?.teams.find(t => t.team === teamMeta.id);
              return (
                <TeamCard key={teamMeta.id} teamMeta={teamMeta} teamStatus={teamStatus} />
              );
            })}
          </div>

          {/* Claude commands info */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 16px" }}>
              {"⌨️"} 순찰 명령어
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}>
              {[
                { cmd: "/project:patrol", desc: "전체 순찰 (3팀 순차 실행)", emoji: "🎖️" },
                { cmd: "/project:patrol-management", desc: "Team Shield 관리 순찰", emoji: "🛡️" },
                { cmd: "/project:patrol-maintenance", desc: "Team Engine 유지 순찰", emoji: "⚙️" },
                { cmd: "/project:patrol-repair", desc: "Team Medic 보수 순찰", emoji: "🏥" },
              ].map(item => (
                <div key={item.cmd} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <div>
                    <code style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.accent,
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}>
                      {item.cmd}
                    </code>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patrol log */}
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 16px" }}>
              {"📋"} 순찰 이력
            </h2>
            {logs.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: 40,
                color: T.muted,
                fontSize: 13,
              }}>
                아직 순찰 이력이 없습니다. Claude Code에서 순찰 명령어를 실행해보세요.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {logs.map((entry, i) => (
                  <LogEntry key={i} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
