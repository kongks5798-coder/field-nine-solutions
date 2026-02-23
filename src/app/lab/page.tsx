"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { T } from "@/lib/theme";
import { LAB_AGENTS, AGENT_FIELDS, getAgent, type LabAgent } from "@/lib/lab-agents";
import { ROUND_LABELS, type RoundName, type MatchScore, type Innovation, type LabTeam } from "@/lib/lab-engine";

/* ── API Types ──────────────────────────────────────── */

interface Match {
  id: string;
  round: RoundName;
  matchOrder: number;
  teamA: LabTeam | null;
  teamB: LabTeam | null;
  scoreA: MatchScore | null;
  scoreB: MatchScore | null;
  innovationA: Innovation | null;
  innovationB: Innovation | null;
  winnerId: string | null;
  reasoning: string | null;
}

interface Tournament {
  id: string;
  season: number;
  status: "pending" | "play_in" | "round_8" | "semi" | "final" | "completed";
  teams: LabTeam[];
  matches: Match[];
  currentRound: RoundName | null;
  champion: LabTeam | null;
  createdAt: string;
}

/* ── Helpers ────────────────────────────────────────── */

const SCORE_BARS: { key: keyof Omit<MatchScore, "total">; label: string; color: string; max: number }[] = [
  { key: "innovation",   label: "혁신성",     color: T.accent,  max: 30 },
  { key: "feasibility",  label: "실현성",     color: T.blue,    max: 25 },
  { key: "impact",       label: "임팩트",     color: T.green,   max: 25 },
  { key: "quality",      label: "완성도",     color: "#a855f7", max: 20 },
];

function statusLabel(s: Tournament["status"]): string {
  if (s === "pending") return "대기";
  if (s === "completed") return "완료";
  return ROUND_LABELS[s as RoundName] ?? s;
}

function statusColor(s: Tournament["status"]): string {
  if (s === "pending") return T.muted;
  if (s === "completed") return T.green;
  return T.accent;
}

function teamAgents(team: LabTeam): LabAgent[] {
  return team.agentIds.map(id => getAgent(id)).filter(Boolean) as LabAgent[];
}

/* ── Sub-components ─────────────────────────────────── */

function AgentListSection({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const grouped = AGENT_FIELDS.map(field => ({
    field,
    agents: LAB_AGENTS.filter(a => a.field === field),
  }));

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "8px 12px", background: "none", border: "none",
          color: T.text, fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}
      >
        <span>에이전트 30명</span>
        <span style={{ fontSize: 10, color: T.muted }}>{collapsed ? "▶" : "▼"}</span>
      </button>
      {!collapsed && (
        <div style={{ padding: "0 8px 8px", maxHeight: 320, overflowY: "auto" }}>
          {grouped.map(({ field, agents }) => (
            <div key={field} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, padding: "4px 4px 2px", letterSpacing: "0.04em" }}>
                {field}
              </div>
              {agents.map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "3px 4px", fontSize: 11,
                }}>
                  <span>{a.emoji}</span>
                  <span style={{ color: T.text }}>{a.nameKo}</span>
                  <span style={{
                    marginLeft: "auto", fontSize: 9, padding: "1px 6px",
                    borderRadius: 4, background: "rgba(249,115,22,0.1)",
                    color: T.accent, whiteSpace: "nowrap",
                  }}>
                    {a.specialty}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team,
  isActive,
  onClick,
}: {
  team: LabTeam;
  isActive: boolean;
  onClick: () => void;
}) {
  const agents = teamAgents(team);
  return (
    <div
      onClick={onClick}
      style={{
        padding: "6px 8px", borderRadius: 8, cursor: "pointer",
        border: `1px solid ${isActive ? T.accent : T.border}`,
        background: isActive ? "rgba(249,115,22,0.08)" : "transparent",
        opacity: team.eliminated ? 0.3 : 1,
        transition: "all 0.15s", marginBottom: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: "1px 5px",
          borderRadius: 4, background: "rgba(249,115,22,0.15)",
          color: T.accent, flexShrink: 0,
        }}>
          #{team.seed}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {team.teamName}
        </span>
        <span style={{ fontSize: 12, flexShrink: 0 }}>
          {agents.map(a => a.emoji).join("")}
        </span>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  teams,
  isSelected,
  onClick,
}: {
  match: Match;
  teams: LabTeam[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const played = match.scoreA !== null && match.scoreB !== null;
  const teamA = match.teamA;
  const teamB = match.teamB;
  const aWon = played && match.winnerId === teamA?.id;
  const bWon = played && match.winnerId === teamB?.id;

  return (
    <div
      onClick={onClick}
      style={{
        width: 152, background: T.card, borderRadius: 8, overflow: "hidden",
        border: `1px ${played ? "solid" : "dashed"} ${isSelected ? T.accent : T.border}`,
        cursor: "pointer", transition: "border-color 0.15s",
        boxShadow: isSelected ? `0 0 12px ${T.accent}30` : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Team A */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 8px", fontSize: 11,
        borderLeft: aWon ? `3px solid ${T.accent}` : "3px solid transparent",
        background: aWon ? "rgba(249,115,22,0.08)" : "transparent",
      }}>
        <span style={{
          flex: 1, fontWeight: aWon ? 700 : 400,
          color: teamA ? T.text : T.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {teamA ? teamA.teamName : "TBD"}
        </span>
        {played && match.scoreA && (
          <span style={{ fontSize: 10, fontWeight: 700, color: aWon ? T.accent : T.muted }}>
            {match.scoreA.total}
          </span>
        )}
      </div>
      <div style={{ height: 1, background: T.border }} />
      {/* Team B */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 8px", fontSize: 11,
        borderLeft: bWon ? `3px solid ${T.accent}` : "3px solid transparent",
        background: bWon ? "rgba(249,115,22,0.08)" : "transparent",
      }}>
        <span style={{
          flex: 1, fontWeight: bWon ? 700 : 400,
          color: teamB ? T.text : T.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {teamB ? teamB.teamName : "TBD"}
        </span>
        {played && match.scoreB && (
          <span style={{ fontSize: 10, fontWeight: 700, color: bWon ? T.accent : T.muted }}>
            {match.scoreB.total}
          </span>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%", borderRadius: 3, background: color,
          width: `${(value / max) * 100}%`, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function MatchDetailPanel({
  match,
  onClose,
  isMobile,
}: {
  match: Match;
  onClose: () => void;
  isMobile: boolean;
}) {
  const [expandA, setExpandA] = useState(false);
  const [expandB, setExpandB] = useState(false);

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.6)", display: "flex",
        alignItems: "flex-end", justifyContent: "center",
      }
    : {};

  const innerStyle: React.CSSProperties = isMobile
    ? {
        width: "100%", maxHeight: "85vh", borderRadius: "16px 16px 0 0",
        background: T.surface, overflowY: "auto",
      }
    : {
        width: 320, background: T.surface, borderLeft: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0,
      };

  const renderTeamSection = (
    label: string,
    team: LabTeam | null,
    score: MatchScore | null,
    innovation: Innovation | null,
    expanded: boolean,
    toggleExpand: () => void,
    isWinner: boolean,
  ) => {
    if (!team) return null;
    const agents = teamAgents(team);
    return (
      <div style={{
        padding: "12px 14px", borderBottom: `1px solid ${T.border}`,
        borderLeft: isWinner ? `3px solid ${T.accent}` : "3px solid transparent",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: isWinner ? T.accent : T.text, marginBottom: 8 }}>
          {team.teamName}
          {isWinner && <span style={{ marginLeft: 6, fontSize: 12 }}>{"🏆"}</span>}
        </div>
        {/* Agents */}
        <div style={{ marginBottom: 8 }}>
          {agents.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}>{a.emoji}</span>
              <span style={{ fontSize: 11, color: T.text }}>{a.nameKo}</span>
              <span style={{ fontSize: 9, color: T.accent, marginLeft: "auto" }}>{a.specialty}</span>
            </div>
          ))}
        </div>
        {/* Scores */}
        {score && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              총점: {score.total}점
            </div>
            {SCORE_BARS.map(bar => (
              <ScoreBar
                key={bar.key}
                label={bar.label}
                value={score[bar.key]}
                max={bar.max}
                color={bar.color}
              />
            ))}
          </div>
        )}
        {/* Innovation */}
        {innovation && (
          <div>
            <button
              onClick={toggleExpand}
              style={{
                display: "flex", alignItems: "center", gap: 4, width: "100%",
                padding: "6px 0", background: "none", border: "none",
                color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              <span>{expanded ? "▼" : "▶"}</span>
              <span>{innovation.title}</span>
            </button>
            {expanded && (
              <div style={{ padding: "4px 0 0 8px" }}>
                <p style={{ fontSize: 11, color: T.text, lineHeight: 1.6, margin: "0 0 6px" }}>
                  {innovation.summary}
                </p>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>아키텍처</div>
                <p style={{ fontSize: 10, color: T.text, lineHeight: 1.5, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
                  {innovation.architecture}
                </p>
                {innovation.codeSnippet && (
                  <>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>코드</div>
                    <pre style={{
                      fontSize: 10, color: T.green, background: "rgba(0,0,0,0.3)",
                      padding: 8, borderRadius: 6, overflow: "auto",
                      maxHeight: 120, margin: "0 0 6px", whiteSpace: "pre-wrap",
                      fontFamily: "monospace",
                    }}>
                      {innovation.codeSnippet}
                    </pre>
                  </>
                )}
                {innovation.techStack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {innovation.techStack.map(t => (
                      <span key={t} style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 4,
                        background: "rgba(96,165,250,0.12)", color: T.blue,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const played = match.scoreA !== null;
  const aWon = played && match.winnerId === match.teamA?.id;
  const bWon = played && match.winnerId === match.teamB?.id;

  const content = (
    <div style={innerStyle}>
      {/* Header */}
      <div style={{
        padding: "12px 14px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, color: T.accent, fontWeight: 700 }}>
            {ROUND_LABELS[match.round]}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
            Match {match.matchOrder}
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "none",
            color: T.muted, fontSize: 14, cursor: "pointer",
          }}>
            &times;
          </button>
        )}
      </div>

      {renderTeamSection("TEAM A", match.teamA, match.scoreA, match.innovationA, expandA, () => setExpandA(v => !v), aWon)}
      {renderTeamSection("TEAM B", match.teamB, match.scoreB, match.innovationB, expandB, () => setExpandB(v => !v), bWon)}

      {/* Judge reasoning */}
      {match.reasoning && (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>심사평</div>
          <p style={{ fontSize: 11, color: T.text, lineHeight: 1.6, margin: 0 }}>
            {match.reasoning}
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div style={panelStyle} onClick={onClose}>
        <div onClick={e => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

/* ── Bracket Visualization ──────────────────────────── */

function BracketView({
  matches,
  teams,
  champion,
  selectedMatchId,
  onSelectMatch,
}: {
  matches: Match[];
  teams: LabTeam[];
  champion: LabTeam | null;
  selectedMatchId: string | null;
  onSelectMatch: (m: Match) => void;
}) {
  const byRound = (round: RoundName) => matches.filter(m => m.round === round).sort((a, b) => a.matchOrder - b.matchOrder);

  const playIn = byRound("play_in");
  const round8 = byRound("round_8");
  const semi   = byRound("semi");
  const final_ = byRound("final");

  // Column definitions: each column has a round label and the matches
  const columns: { label: string; matches: Match[]; gapMultiplier: number }[] = [
    { label: "플레이인", matches: playIn, gapMultiplier: 1 },
    { label: "8강",     matches: round8, gapMultiplier: 1 },
    { label: "4강",     matches: semi,   gapMultiplier: 2 },
    { label: "결승",    matches: final_, gapMultiplier: 4 },
  ];

  return (
    <div style={{
      display: "flex", gap: 24, padding: "16px 20px",
      minWidth: 900, alignItems: "flex-start",
    }}>
      {columns.map((col, ci) => (
        <div key={col.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: T.muted, padding: "4px 10px",
            borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 8,
          }}>
            {col.label}
          </div>
          <div style={{
            display: "flex", flexDirection: "column",
            gap: col.gapMultiplier * 16,
            justifyContent: "center",
            minHeight: col.gapMultiplier * 80 * Math.max(col.matches.length, 1),
          }}>
            {col.matches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                teams={teams}
                isSelected={selectedMatchId === m.id}
                onClick={() => onSelectMatch(m)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Champion */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "center", minHeight: 200 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: T.muted, padding: "4px 10px",
          borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 8,
        }}>
          우승
        </div>
        <div style={{
          width: 152, padding: "16px 12px", borderRadius: 10, textAlign: "center",
          background: champion ? "rgba(249,115,22,0.12)" : T.card,
          border: `2px ${champion ? "solid" : "dashed"} ${champion ? T.accent : T.border}`,
          boxShadow: champion ? `0 0 24px ${T.accent}20` : "none",
        }}>
          {champion ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{"🏆"}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{champion.teamName}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                {teamAgents(champion).map(a => a.emoji).join(" ")}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.2 }}>{"🏆"}</div>
              <div style={{ fontSize: 11, color: T.muted }}>진행 중</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────── */

export default function DalkakLabPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [roundLoading, setRoundLoading] = useState(false);
  const [agentsCollapsed, setAgentsCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<"bracket" | "agents" | "detail">("bracket");
  const isMobile = useMediaQuery("(max-width: 767px)");

  /* ── Data fetching ────────────────────────────────── */

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await fetch("/api/lab/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch { /* silent */ }
  }, []);

  const fetchTournament = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/tournaments/${id}`);
      if (res.ok) {
        const data: Tournament = await res.json();
        setActiveTournament(data);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  useEffect(() => {
    if (tournaments.length > 0 && !activeTournament) {
      fetchTournament(tournaments[0].id);
    }
  }, [tournaments, activeTournament, fetchTournament]);

  /* ── Actions ──────────────────────────────────────── */

  const createTournament = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/tournaments", { method: "POST" });
      if (res.ok) {
        const data: Tournament = await res.json();
        setTournaments(prev => [data, ...prev]);
        setActiveTournament(data);
        setSelectedMatch(null);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const executeNextRound = async () => {
    if (!activeTournament || roundLoading) return;
    setRoundLoading(true);
    try {
      const res = await fetch(`/api/lab/tournaments/${activeTournament.id}/round`, {
        method: "POST",
      });
      if (res.ok) {
        const data: Tournament = await res.json();
        setActiveTournament(data);
        setSelectedMatch(null);
      }
    } catch { /* silent */ }
    setRoundLoading(false);
  };

  const switchTournament = (id: string) => {
    setSelectedMatch(null);
    fetchTournament(id);
  };

  const teams = activeTournament?.teams ?? [];
  const matches = activeTournament?.matches ?? [];
  const isCompleted = activeTournament?.status === "completed";

  /* ── Render ───────────────────────────────────────── */

  return (
    <AppShell>
      <style>{`
        @keyframes lab-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes lab-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
      <div style={{
        display: "flex", height: "calc(100vh - 56px)", background: T.bg,
        color: T.text, fontFamily: '"Pretendard", Inter, sans-serif',
        overflow: "hidden", position: "relative",
      }}>

        {/* ════ Left Panel ════ */}
        {(!isMobile || mobileTab === "agents") && (
          <div style={{
            width: isMobile ? "100%" : 280,
            background: T.surface,
            borderRight: isMobile ? "none" : `1px solid ${T.border}`,
            display: "flex", flexDirection: "column", flexShrink: 0,
            overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{"🔬"}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>개발실</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {activeTournament ? `시즌 ${activeTournament.season}` : "대회 없음"}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent list */}
            <div style={{ borderBottom: `1px solid ${T.border}` }}>
              <AgentListSection
                collapsed={agentsCollapsed}
                onToggle={() => setAgentsCollapsed(v => !v)}
              />
            </div>

            {/* Teams */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, padding: "4px 4px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                현재 팀 구성 {teams.length > 0 && `(${teams.length}팀)`}
              </div>
              {teams.length === 0 ? (
                <div style={{ fontSize: 11, color: T.muted, textAlign: "center", padding: 16 }}>
                  토너먼트를 생성하면 팀이 편성됩니다
                </div>
              ) : (
                teams.map(team => (
                  <TeamCard
                    key={team.id ?? team.seed}
                    team={team}
                    isActive={false}
                    onClick={() => {}}
                  />
                ))
              )}
            </div>

            {/* Season switcher */}
            {tournaments.length > 1 && (
              <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}` }}>
                <select
                  value={activeTournament?.id ?? ""}
                  onChange={e => switchTournament(e.target.value)}
                  style={{
                    width: "100%", padding: "6px 8px", borderRadius: 6,
                    border: `1px solid ${T.border}`, background: T.card,
                    color: T.text, fontSize: 11, outline: "none",
                  }}
                >
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>
                      시즌 {t.season} — {statusLabel(t.status)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ════ Center Panel — Bracket ════ */}
        {(!isMobile || mobileTab === "bracket") && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Top bar */}
            <div style={{
              padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              background: T.surface,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                {activeTournament ? `시즌 ${activeTournament.season} 토너먼트` : "개발실 토너먼트"}
              </div>
              {activeTournament && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 4, color: statusColor(activeTournament.status),
                  background: `${statusColor(activeTournament.status)}18`,
                }}>
                  {statusLabel(activeTournament.status)}
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={createTournament}
                disabled={loading}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #f97316, #f43f5e)",
                  color: "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
                }}
              >
                {loading ? "생성 중..." : "새 토너먼트"}
              </button>
              {activeTournament && !isCompleted && (
                <button
                  onClick={executeNextRound}
                  disabled={roundLoading}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: `1px solid ${T.accent}`, background: "transparent",
                    color: T.accent, fontSize: 12, fontWeight: 700,
                    cursor: roundLoading ? "default" : "pointer",
                    opacity: roundLoading ? 0.6 : 1, transition: "opacity 0.2s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {roundLoading && (
                    <span style={{
                      display: "inline-block", width: 12, height: 12,
                      border: `2px solid ${T.accent}`, borderTopColor: "transparent",
                      borderRadius: "50%", animation: "lab-spin 0.8s linear infinite",
                    }} />
                  )}
                  {roundLoading ? "실행 중..." : "다음 라운드 실행"}
                </button>
              )}
            </div>

            {/* Bracket area */}
            <div style={{
              flex: 1, overflowX: "auto", overflowY: "auto",
              background: `radial-gradient(circle at 50% 40%, rgba(249,115,22,0.03) 0%, transparent 60%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!activeTournament ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 12 }}>{"🔬"}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.muted }}>
                    토너먼트를 생성하여 AI 개발 대회를 시작하세요
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                    30명의 AI 에이전트가 10팀으로 나뉘어 혁신 기술을 겨룹니다
                  </div>
                </div>
              ) : matches.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 14, color: T.muted, animation: "lab-pulse 1.5s infinite" }}>
                    대진표를 준비 중입니다...
                  </div>
                </div>
              ) : (
                <BracketView
                  matches={matches}
                  teams={teams}
                  champion={activeTournament.champion}
                  selectedMatchId={selectedMatch?.id ?? null}
                  onSelectMatch={m => {
                    setSelectedMatch(m);
                    if (isMobile) setMobileTab("detail");
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ════ Right Panel — Match Detail ════ */}
        {selectedMatch && (!isMobile || mobileTab === "detail") && (
          <MatchDetailPanel
            match={selectedMatch}
            onClose={() => {
              setSelectedMatch(null);
              if (isMobile) setMobileTab("bracket");
            }}
            isMobile={isMobile}
          />
        )}

        {/* ════ Mobile Bottom Tab Bar ════ */}
        {isMobile && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
            display: "flex", background: T.surface,
            borderTop: `1px solid ${T.border}`,
            padding: "6px 0", paddingBottom: "max(6px, env(safe-area-inset-bottom))",
          }}>
            {(
              [
                { key: "agents" as const,  icon: "👥", label: "에이전트" },
                { key: "bracket" as const, icon: "🏟️", label: "대진표" },
                { key: "detail" as const,  icon: "📊", label: "상세" },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                disabled={tab.key === "detail" && !selectedMatch}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 2, padding: "4px 0",
                  background: "none", border: "none",
                  color: mobileTab === tab.key ? T.accent : T.muted,
                  fontSize: 10, fontWeight: mobileTab === tab.key ? 700 : 400,
                  cursor: (tab.key === "detail" && !selectedMatch) ? "default" : "pointer",
                  opacity: (tab.key === "detail" && !selectedMatch) ? 0.3 : 1,
                }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
