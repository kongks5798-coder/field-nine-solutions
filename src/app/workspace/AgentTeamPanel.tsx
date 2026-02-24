"use client";

import React, { useState } from "react";
import { T } from "./workspace.constants";

/* ── Types ───────────────────────────────────────────────────────────────── */
export interface TeamAgent {
  nameKo: string;
  emoji: string;
  field: string;
  specialty: string;
}

export interface AgentTeamPanelProps {
  team: TeamAgent[];
  phase: "idle" | "planning" | "coding" | "reviewing" | null;
  onActivate: (prompt: string) => void;
  onClose: () => void;
  onReshuffle: () => void;
  isActive: boolean;
}

/* ── Field → border color map ────────────────────────────────────────────── */
const FIELD_COLORS: Record<string, string> = {
  "AI/ML":      "#22c55e",
  Security:     "#ef4444",
  Frontend:     "#60a5fa",
  Backend:      "#a855f7",
  Cloud:        "#f97316",
  Data:         "#eab308",
  Mobile:       "#ec4899",
  DevOps:       "#06b6d4",
  Blockchain:   "#8b5cf6",
  Research:     "#14b8a6",
};

/* ── Phase label ─────────────────────────────────────────────────────────── */
function phaseLabel(p: AgentTeamPanelProps["phase"]): string {
  switch (p) {
    case "planning":  return "\uD83D\uDCAD 아이디어 구상 중...";
    case "coding":    return "\u2328\uFE0F 코드 작성 중...";
    case "reviewing": return "\uD83D\uDD0D 검토 중...";
    default:          return "대기 중";
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function AgentTeamPanel({ team, phase, onActivate, onClose, onReshuffle, isActive }: AgentTeamPanelProps) {
  const [prompt, setPrompt] = useState("");
  const isPulsing = phase === "planning" || phase === "coding" || phase === "reviewing";

  const handleSubmit = () => {
    const t = prompt.trim();
    if (!t) return;
    setPrompt("");
    onActivate(t);
  };

  return (
    <div style={{
      position: "absolute", bottom: 8, right: 8, zIndex: 90,
      width: 340, maxWidth: "calc(100vw - 16px)",
      background: T.surface, border: `1px solid ${T.borderHi}`,
      borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px 8px", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{"\uD83E\uDD16"}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>AI 팀</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: T.accent,
            background: `${T.accent}20`, padding: "1px 7px", borderRadius: 8,
          }}>{team.length}명</span>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: T.muted,
          fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
        }} aria-label="닫기">{"\u2715"}</button>
      </div>

      {/* Team members */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", justifyContent: "center" }}>
        {team.map((a, i) => {
          const bc = FIELD_COLORS[a.field] ?? T.border;
          return (
            <div key={i} style={{
              flex: 1, maxWidth: 100, padding: "10px 6px 8px",
              background: "#0d1117", borderRadius: 12,
              border: `2px solid ${bc}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "transform 0.15s",
            }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{a.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textAlign: "center" }}>{a.nameKo}</span>
              <span style={{
                fontSize: 9, fontWeight: 600, color: bc,
                background: `${bc}18`, padding: "1px 6px", borderRadius: 6,
                whiteSpace: "nowrap",
              }}>{a.field}</span>
              <span style={{
                fontSize: 9, color: T.muted, textAlign: "center",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", width: "100%",
              }}>{a.specialty}</span>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "4px 14px 8px", fontSize: 12, color: isPulsing ? T.accent : T.muted,
        fontWeight: 600,
      }}>
        {isPulsing && (
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: T.accent, animation: "pulse 1.2s ease-in-out infinite",
          }} />
        )}
        <span>{phaseLabel(phase)}</span>
      </div>

      {/* Quick prompt */}
      <div style={{ padding: "0 14px 10px", display: "flex", gap: 6 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="팀에게 요청..."
          disabled={isActive}
          style={{
            flex: 1, padding: "8px 10px", fontSize: 12,
            background: "rgba(255,255,255,0.05)", color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 8,
            outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isActive || !prompt.trim()}
          style={{
            padding: "8px 12px", fontSize: 11, fontWeight: 700,
            background: isActive ? T.muted : T.accent, color: "#fff",
            border: "none", borderRadius: 8, cursor: isActive ? "not-allowed" : "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap", opacity: isActive ? 0.5 : 1,
          }}
        >팀에게 요청</button>
      </div>

      {/* Reshuffle */}
      <div style={{ padding: "0 14px 12px", display: "flex", justifyContent: "center" }}>
        <button
          onClick={onReshuffle}
          disabled={isActive}
          style={{
            padding: "6px 16px", fontSize: 11, fontWeight: 600,
            background: "rgba(255,255,255,0.04)", color: T.muted,
            border: `1px solid ${T.border}`, borderRadius: 8,
            cursor: isActive ? "not-allowed" : "pointer", fontFamily: "inherit",
            transition: "all 0.15s", opacity: isActive ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >{"\uD83D\uDD00"} 팀 변경</button>
      </div>
    </div>
  );
}
