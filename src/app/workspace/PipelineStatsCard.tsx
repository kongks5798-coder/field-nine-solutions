"use client";

import { useState, useEffect } from "react";
import { T } from "./workspace.constants";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PipelineRunStats {
  totalRuns: number;
  totalDuration: number; // ms
  totalScore: number;
  lastRun: string | null; // ISO string
}

export interface PipelineStatsStorage {
  team?: PipelineRunStats;
}

export const PIPELINE_STATS_KEY = "dalkak_pipeline_stats";

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadStats(): PipelineStatsStorage {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PIPELINE_STATS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PipelineStatsStorage;
  } catch {
    return {};
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}초`;
}

function scoreColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 70) return "#f97316";
  return "#f87171";
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  onClose?: () => void;
}

export function PipelineStatsCard({ onClose }: Props) {
  const [stats, setStats] = useState<PipelineStatsStorage>({});

  useEffect(() => {
    setStats(loadStats());

    // Re-sync when localStorage changes (e.g. after generation completes)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PIPELINE_STATS_KEY) setStats(loadStats());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const team = stats.team;
  const teamAvgDuration = team && team.totalRuns > 0
    ? Math.round(team.totalDuration / team.totalRuns)
    : null;
  const teamAvgScore = team && team.totalRuns > 0
    ? Math.round(team.totalScore / team.totalRuns)
    : null;

  // Legacy pipeline estimates (historical averages — not measured live)
  const LEGACY_AVG_DURATION_MS = 120_000;
  const LEGACY_AVG_SCORE = 80;

  const speedup = teamAvgDuration
    ? (LEGACY_AVG_DURATION_MS / teamAvgDuration).toFixed(1)
    : null;

  const colHeader: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    color: T.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 8,
  };

  const colStyle = (isTeam: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    background: isTeam ? `${T.accent}12` : "#f9fafb",
    border: `1px solid ${isTeam ? `${T.accent}40` : T.border}`,
  });

  const statRow = (label: string, value: string, valueColor?: string): React.ReactNode => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, color: T.muted, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: valueColor ?? T.text, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute", top: "calc(100% + 6px)", right: 0,
        background: "#ffffff",
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 200,
        minWidth: 300,
        padding: 14,
        fontFamily: "inherit",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
          파이프라인 성능
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {speedup && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: `${T.accent}18`, color: T.accent,
              padding: "2px 8px", borderRadius: 20,
            }}>
              {speedup}x 빠름
            </span>
          )}
          {onClose && (
            <button onClick={onClose} style={{
              width: 20, height: 20, borderRadius: 4, border: "none",
              background: "transparent", color: T.muted,
              cursor: "pointer", fontSize: 13, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontFamily: "inherit",
            }}>&#10005;</button>
          )}
        </div>
      </div>

      {/* Two-column comparison */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* Team Pipeline column */}
        <div style={colStyle(true)}>
          <div style={{ ...colHeader, color: T.accent }}>팀 에이전트</div>
          {teamAvgDuration !== null
            ? statRow("평균 속도", formatDuration(teamAvgDuration), "#22c55e")
            : statRow("평균 속도", "—", T.muted)}
          {teamAvgScore !== null
            ? statRow("평균 품질", `${teamAvgScore}점`, scoreColor(teamAvgScore))
            : statRow("평균 품질", "—", T.muted)}
          {statRow("총 생성 수", team ? `${team.totalRuns}회` : "0회", T.text)}
          {team?.lastRun && (
            <div style={{ fontSize: 9, color: T.muted, marginTop: 6 }}>
              마지막: {new Date(team.lastRun).toLocaleDateString("ko-KR")}
            </div>
          )}
        </div>

        {/* Legacy Pipeline column */}
        <div style={colStyle(false)}>
          <div style={{ ...colHeader }}>레거시 (예상)</div>
          {statRow("평균 속도", formatDuration(LEGACY_AVG_DURATION_MS), "#f87171")}
          {statRow("평균 품질", `${LEGACY_AVG_SCORE}점`, scoreColor(LEGACY_AVG_SCORE))}
          {statRow("총 생성 수", "—", T.muted)}
          <div style={{ fontSize: 9, color: T.muted, marginTop: 6 }}>
            순차적 5단계 기반 추정치
          </div>
        </div>
      </div>

      {/* No data placeholder */}
      {!team && (
        <div style={{
          marginTop: 10, fontSize: 10, color: T.muted, textAlign: "center",
          padding: "8px", background: "#f9fafb", borderRadius: 6,
        }}>
          아직 생성 이력이 없습니다. 첫 생성 후 데이터가 표시됩니다.
        </div>
      )}

      {/* Info note */}
      <div style={{
        marginTop: 10, fontSize: 9, color: T.muted,
        borderTop: `1px solid ${T.border}`, paddingTop: 8,
      }}>
        Architect(3초) → 병렬 빌더(15초) → Critic+Patcher(13초) = 약 31초
      </div>
    </div>
  );
}
