"use client";

// PipelineAgentView — cinematic agent-team visualization during generation
// Shows 6 pipeline agents (Architect→HTML+CSS+JS→Critic→Patcher) as animated cards
// Replaces the minimal GenerationPhaseBar with a movie-style team view

import { useState, useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type PipelinePhase =
  | "idle"
  | "architect"
  | "building"      // HTML+CSS+JS running in parallel
  | "html-done"
  | "css-done"
  | "js-done"
  | "critic"
  | "patching"
  | "done";

type AgentStatus = "pending" | "running" | "done" | "skipped";

interface PipelineAgent {
  id: string;
  emoji: string;
  nameKo: string;
  model: "Haiku" | "Sonnet";
  role: string;
  phase: PipelinePhase[];  // phases when this agent is "running"
  donePhase: PipelinePhase[];  // phases when this agent is "done"
  color: string;
}

const AGENTS: PipelineAgent[] = [
  {
    id: "architect",
    emoji: "🎯",
    nameKo: "아키텍트",
    model: "Haiku",
    role: "설계 · 스펙 정의",
    phase: ["architect"],
    donePhase: ["building", "html-done", "css-done", "js-done", "critic", "patching", "done"],
    color: "#f97316",
  },
  {
    id: "html",
    emoji: "🏗️",
    nameKo: "HTML 빌더",
    model: "Sonnet",
    role: "구조 · 마크업",
    phase: ["building"],
    donePhase: ["html-done", "css-done", "js-done", "critic", "patching", "done"],
    color: "#60a5fa",
  },
  {
    id: "css",
    emoji: "🎨",
    nameKo: "CSS 빌더",
    model: "Sonnet",
    role: "스타일 · 애니메이션",
    phase: ["building"],
    donePhase: ["css-done", "js-done", "critic", "patching", "done"],
    color: "#a855f7",
  },
  {
    id: "js",
    emoji: "⚙️",
    nameKo: "JS 빌더",
    model: "Sonnet",
    role: "로직 · 인터랙션",
    phase: ["building"],
    donePhase: ["js-done", "critic", "patching", "done"],
    color: "#eab308",
  },
  {
    id: "critic",
    emoji: "🔍",
    nameKo: "크리틱",
    model: "Haiku",
    role: "품질 검증",
    phase: ["critic"],
    donePhase: ["patching", "done"],
    color: "#22c55e",
  },
  {
    id: "patcher",
    emoji: "🔧",
    nameKo: "패처",
    model: "Sonnet",
    role: "자동 수정",
    phase: ["patching"],
    donePhase: ["done"],
    color: "#ef4444",
  },
];

// ── Phase parsing ──────────────────────────────────────────────────────────────

function parsePhase(text: string): PipelinePhase {
  if (!text) return "idle";
  if (text.includes("설계") || text.includes("아키텍")) return "architect";
  if (text.includes("동시 생성") || text.includes("병렬")) return "building";
  if (text.includes("HTML 완성")) return "html-done";
  if (text.includes("CSS 완성")) return "css-done";
  if (text.includes("JS 완성") || text.includes("스크립트 완성")) return "js-done";
  if (text.includes("검증") || text.includes("분석")) return "critic";
  if (text.includes("수정") || text.includes("패치")) return "patching";
  if (text.includes("완료") || text.includes("생성 완료")) return "done";
  // If there's any text but no phase match, assume we're at least "building"
  return "building";
}

function getAgentStatus(agent: PipelineAgent, phase: PipelinePhase): AgentStatus {
  if (phase === "idle") return "pending";
  if (agent.donePhase.includes(phase)) return "done";
  if (agent.phase.includes(phase)) return "running";
  // Special case: patcher is skipped if critic found no issues (done immediately)
  if (agent.id === "patcher" && phase === "done") return "done";
  return "pending";
}

// ── Elapsed timer ──────────────────────────────────────────────────────────────

function useElapsedSeconds(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      setElapsed(0);
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      startRef.current = null;
    }
  }, [active]);

  return elapsed;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ModelBadge({ model }: { model: "Haiku" | "Sonnet" }) {
  return (
    <span style={{
      fontSize: 8,
      fontWeight: 700,
      color: "rgba(255,255,255,0.5)",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      padding: "1px 5px",
      borderRadius: 4,
      letterSpacing: "0.02em",
    }}>
      {model}
    </span>
  );
}

function AgentCard({
  agent,
  status,
  isCompact,
}: {
  agent: PipelineAgent;
  status: AgentStatus;
  isCompact: boolean;
}) {
  const isRunning = status === "running";
  const isDone = status === "done";
  const isPending = status === "pending";

  return (
    <div style={{
      display: "flex",
      flexDirection: isCompact ? "row" : "column",
      alignItems: "center",
      gap: isCompact ? 6 : 4,
      padding: isCompact ? "6px 8px" : "8px 6px",
      borderRadius: 10,
      background: isRunning
        ? `${agent.color}14`
        : isDone
          ? `${agent.color}08`
          : "rgba(15,20,40,0.6)",
      border: `1.5px solid ${
        isRunning ? agent.color : isDone ? `${agent.color}50` : "rgba(51,65,85,0.5)"
      }`,
      transition: "all 0.3s ease",
      boxShadow: isRunning ? `0 0 12px ${agent.color}30` : "none",
      animation: isRunning ? "pav-glow 2s ease-in-out infinite" : "none",
      minWidth: isCompact ? 0 : 60,
      flex: isCompact ? 1 : "none",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Running shimmer */}
      {isRunning && (
        <div style={{
          position: "absolute", top: 0, left: "-100%", right: 0, bottom: 0,
          background: `linear-gradient(90deg, transparent 0%, ${agent.color}18 50%, transparent 100%)`,
          animation: "pav-shimmer 1.8s ease-in-out infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Emoji / Status icon */}
      <div style={{
        fontSize: isCompact ? 16 : 22,
        lineHeight: 1,
        filter: isPending ? "grayscale(1) opacity(0.4)" : "none",
        transition: "filter 0.3s",
        flexShrink: 0,
        position: "relative",
      }}>
        {isDone ? (
          <span style={{ fontSize: isCompact ? 14 : 18, color: agent.color }}>✓</span>
        ) : (
          agent.emoji
        )}
        {isRunning && (
          <span style={{
            position: "absolute",
            top: -2, right: -4,
            width: 6, height: 6,
            borderRadius: "50%",
            background: agent.color,
            animation: "pav-ping 1s ease-in-out infinite",
          }} />
        )}
      </div>

      {/* Name + model */}
      {!isCompact && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: isPending ? "#475569" : "#e2e8f0",
            textAlign: "center",
            transition: "color 0.3s",
          }}>
            {agent.nameKo}
          </span>
          <ModelBadge model={agent.model} />
          <span style={{
            fontSize: 8, color: "#475569", textAlign: "center",
            opacity: isPending ? 0.5 : 1,
          }}>
            {agent.role}
          </span>
        </div>
      )}

      {isCompact && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: isPending ? "#475569" : "#e2e8f0",
          }}>
            {agent.nameKo}
          </span>
          <ModelBadge model={agent.model} />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  streamingText: string;
}

export function PipelineAgentView({ streamingText }: Props) {
  const phase = parsePhase(streamingText);
  const isActive = phase !== "idle" && phase !== "done";
  const isGenerating = phase !== "idle";

  const elapsed = useElapsedSeconds(isActive);
  const [expanded, setExpanded] = useState(true);

  // Auto-collapse after done
  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => setExpanded(false), 3000);
      return () => clearTimeout(t);
    }
    if (phase !== "idle") {
      setExpanded(true);
    }
  }, [phase]);

  if (!isGenerating) return null;

  const statuses = AGENTS.map(a => getAgentStatus(a, phase));
  const runningCount = statuses.filter(s => s === "running").length;
  const doneCount = statuses.filter(s => s === "done").length;

  // Compact: just a thin bar with agent pills
  if (!expanded) {
    return (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(5,5,8,0.92)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(249,115,22,0.2)",
        padding: "6px 12px",
        display: "flex", alignItems: "center", gap: 6,
        zIndex: 50,
        cursor: "pointer",
      }} onClick={() => setExpanded(true)}>
        <span style={{ fontSize: 10, color: "#64748b" }}>🤖</span>
        {AGENTS.map((a, i) => (
          <AgentCard key={a.id} agent={a} status={statuses[i]} isCompact />
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748b" }}>
          {phase === "done" ? `✅ ${elapsed}s` : `⏱ ${elapsed}s`}
        </span>
        <span style={{ fontSize: 10, color: "#f97316" }}>▲</span>
      </div>
    );
  }

  // Expanded: full agent card grid
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: "rgba(5,5,8,0.95)", backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(249,115,22,0.25)",
      padding: "12px 14px 10px",
      zIndex: 50,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f97316", letterSpacing: "0.04em" }}>
            ⚡ 팀 에이전트 파이프라인
          </span>
          {runningCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: "#f97316", background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
              padding: "1px 7px", borderRadius: 8,
              animation: "pav-blink 1s ease-in-out infinite",
            }}>
              {runningCount}개 동시 실행 중
            </span>
          )}
          {phase === "done" && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: "#f97316", background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
              padding: "1px 7px", borderRadius: 8,
            }}>
              ✅ 완료
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#64748b" }}>
            ⏱ {elapsed}s · {doneCount}/{AGENTS.length} 완료
          </span>
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: "none", border: "none", color: "#475569",
              fontSize: 12, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
            }}
            aria-label="최소화"
          >▼</button>
        </div>
      </div>

      {/* Agent cards — 6 in a row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 6,
      }}>
        {AGENTS.map((agent, i) => {
          const status = statuses[i];
          // Connector between arch and builders, and between js-done and critic
          return (
            <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && (
                <div style={{
                  width: 0, // No connector space needed in grid
                }} />
              )}
              <AgentCard agent={agent} status={status} isCompact={false} />
            </div>
          );
        })}
      </div>

      {/* Status text + progress bar */}
      <div style={{ marginTop: 8 }}>
        {/* Progress bar */}
        <div style={{
          height: 2, background: "#1e293b", borderRadius: 1, overflow: "hidden",
          marginBottom: 4,
        }}>
          <div style={{
            height: "100%",
            width: `${(doneCount / AGENTS.length) * 100}%`,
            background: "#f97316",
            borderRadius: 1,
            transition: "width 0.5s ease",
          }} />
        </div>
        {/* Status message */}
        <div style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
          {streamingText || "생성 중..."}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pav-glow {
          0%, 100% { box-shadow: 0 0 8px var(--c, #f97316)30; }
          50% { box-shadow: 0 0 16px var(--c, #f97316)60; }
        }
        @keyframes pav-shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes pav-ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes pav-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
