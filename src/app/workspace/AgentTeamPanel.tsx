"use client";

import React, { useState } from "react";
import { T } from "./workspace.constants";
import { useAiStore } from "./stores";
import { getSpecialtyPrompt } from "./ai/agentPromptBuilder";

/* -- Types -- */
export interface TeamAgent {
  nameKo: string;
  emoji: string;
  field: string;
  specialty: string;
}

export interface AgentTeamPanelProps {
  onActivate: (prompt: string) => void;
  onReshuffle: () => void;
}

/* -- Field -> border color map -- */
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

/* -- Phase label -- */
function phaseLabel(p: "planning" | "coding" | "reviewing" | null): string {
  switch (p) {
    case "planning":  return "\uD83D\uDCAD \uC544\uC774\uB514\uC5B4 \uAD6C\uC0C1 \uC911...";
    case "coding":    return "\u2328\uFE0F \uCF54\uB4DC \uC791\uC131 \uC911...";
    case "reviewing": return "\uD83D\uDD0D \uAC80\uD1A0 \uC911...";
    default:          return "\uB300\uAE30 \uC911";
  }
}

/* -- Component -- */
export function AgentTeamPanel({ onActivate, onReshuffle }: AgentTeamPanelProps) {
  // Stores
  const teamAgents = useAiStore(s => s.teamAgents);
  const showTeamPanel = useAiStore(s => s.showTeamPanel);
  const setShowTeamPanel = useAiStore(s => s.setShowTeamPanel);
  const agentPhase = useAiStore(s => s.agentPhase);
  const aiLoading = useAiStore(s => s.aiLoading);

  const [prompt, setPrompt] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [tooltipAgent, setTooltipAgent] = useState<number | null>(null);
  const isPulsing = agentPhase === "planning" || agentPhase === "coding" || agentPhase === "reviewing";
  const isActive = aiLoading;

  if (!showTeamPanel) return null;

  const team = teamAgents.map(a => ({
    nameKo: a.nameKo,
    emoji: a.emoji,
    field: a.field,
    specialty: a.specialty,
  }));

  const handleSubmit = () => {
    const t = prompt.trim();
    if (!t) return;
    setPrompt("");
    onActivate(t);
  };

  const onClose = () => setShowTeamPanel(false);

  const handleAgentClick = (index: number) => {
    setExpandedAgent(prev => prev === index ? null : index);
  };

  return (
    <div style={{
      position: "absolute", bottom: 8, right: 8, zIndex: 90,
      width: 360, maxWidth: "calc(100vw - 16px)",
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
          <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>AI \uD300</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: T.accent,
            background: `${T.accent}20`, padding: "1px 7px", borderRadius: 8,
          }}>{team.length}\uBA85</span>
          {/* Team Specialization Mode Badge */}
          <span style={{
            fontSize: 9, fontWeight: 700, color: "#22c55e",
            background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 8,
            letterSpacing: "0.03em",
            border: "1px solid rgba(34,197,94,0.25)",
          }}>{"\u2728"} \uC804\uBB38\uD654 \uBAA8\uB4DC</span>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: T.muted,
          fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1,
        }} aria-label="\uB2EB\uAE30">{"\u2715"}</button>
      </div>

      {/* Team members */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", justifyContent: "center" }}>
        {team.map((a, i) => {
          const bc = FIELD_COLORS[a.field] ?? T.border;
          const isExpanded = expandedAgent === i;
          const specialtyPrompt = getSpecialtyPrompt(a.field);
          return (
            <div key={i} style={{ flex: 1, maxWidth: 110, position: "relative" }}>
              <div
                onClick={() => handleAgentClick(i)}
                onMouseEnter={() => setTooltipAgent(i)}
                onMouseLeave={() => setTooltipAgent(null)}
                style={{
                  padding: "10px 6px 8px",
                  background: isExpanded ? `${bc}12` : "#0d1117", borderRadius: 12,
                  border: `2px solid ${isExpanded ? bc : bc}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.15s",
                  cursor: "pointer",
                  transform: isExpanded ? "scale(1.03)" : "none",
                  boxShadow: isExpanded ? `0 4px 16px ${bc}30` : "none",
                }}
              >
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
                {/* Expand/collapse indicator */}
                <span style={{
                  fontSize: 8, color: T.muted, marginTop: 2,
                  transition: "transform 0.15s",
                  transform: isExpanded ? "rotate(180deg)" : "none",
                }}>{"\u25BC"}</span>
              </div>

              {/* Tooltip on hover */}
              {tooltipAgent === i && !isExpanded && specialtyPrompt && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                  transform: "translateX(-50%)",
                  width: 220, padding: "8px 10px",
                  background: "#1a1d2e", border: `1px solid ${bc}40`,
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  zIndex: 100, pointerEvents: "none",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: bc, marginBottom: 4 }}>
                    {a.emoji} {a.nameKo} &mdash; {a.specialty}
                  </div>
                  <div style={{ fontSize: 9, color: T.muted, lineHeight: 1.5 }}>
                    {specialtyPrompt}
                  </div>
                  <div style={{
                    position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
                    borderTop: `5px solid ${bc}40`,
                  }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded specialty preview */}
      {expandedAgent !== null && team[expandedAgent] && (() => {
        const a = team[expandedAgent];
        const bc = FIELD_COLORS[a.field] ?? T.border;
        const specialtyPrompt = getSpecialtyPrompt(a.field);
        return (
          <div style={{
            margin: "0 14px 8px", padding: "10px 12px",
            background: `${bc}08`, border: `1px solid ${bc}30`,
            borderRadius: 10,
            animation: "fadeIn 0.2s ease-out",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{a.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{a.nameKo}</span>
              <span style={{
                fontSize: 9, fontWeight: 600, color: bc,
                background: `${bc}18`, padding: "1px 6px", borderRadius: 6,
              }}>{a.specialty}</span>
            </div>
            {specialtyPrompt ? (
              <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
                {specialtyPrompt}
              </div>
            ) : (
              <div style={{ fontSize: 10, color: T.muted, fontStyle: "italic" }}>
                No specialty prompt defined for this field.
              </div>
            )}
          </div>
        );
      })()}

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
        <span>{phaseLabel(agentPhase)}</span>
      </div>

      {/* Quick prompt */}
      <div style={{ padding: "0 14px 10px", display: "flex", gap: 6 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="\uD300\uC5D0\uAC8C \uC694\uCCAD..."
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
        >{"\uD300\uC5D0\uAC8C \uC694\uCCAD"}</button>
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
        >{"\uD83D\uDD00"} \uD300 \uBCC0\uACBD</button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
