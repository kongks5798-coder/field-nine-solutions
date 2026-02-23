"use client";

import { useEffect, useState } from "react";
import { T } from "@/lib/theme";
import { getAgent } from "@/lib/lab-agents";
import { ROUND_LABELS, type RoundName } from "@/lib/lab-engine";

/* ── Types ─────────────────────────────────────────── */

interface Kpi {
  totalTournaments: number;
  totalInnovations: number;
  breakthroughCount: number;
  finalizedCount: number;
}

interface Scores {
  innovation: number;
  feasibility: number;
  impact: number;
  quality: number;
  total: number;
}

interface Breakthrough {
  id: string;
  title: string;
  summary: string;
  architecture: string | null;
  code_snippet: string | null;
  tech_stack: string[];
  scores: Scores | null;
  round_reached: RoundName;
  maturity: number;
  can_reenter: boolean;
  finalized: boolean;
  parent_id: string | null;
  created_at: string;
  team: { id: string; team_name: string; agent_ids: number[]; seed: number } | null;
  tournament: { id: string; season: number; status: string } | null;
  parent: { id: string; title: string } | null;
}

/* ── Constants ─────────────────────────────────────── */

const ROUND_COLORS: Record<string, string> = {
  semi: T.blue,
  final: T.yellow,
};

const ROUND_BADGE_BG: Record<string, string> = {
  semi: "rgba(96,165,250,0.12)",
  final: "rgba(251,191,36,0.12)",
};

const SCORE_LABELS: { key: keyof Omit<Scores, "total">; label: string; max: number; color: string }[] = [
  { key: "innovation",   label: "혁신성",     max: 30, color: T.accent },
  { key: "feasibility",  label: "실현가능성", max: 25, color: T.green  },
  { key: "impact",       label: "임팩트",     max: 25, color: T.blue   },
  { key: "quality",      label: "기술완성도", max: 20, color: T.yellow },
];

/* ── Sub-components ────────────────────────────────── */

function KpiCard({ title, value, color }: { title: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 24px" }}>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color ?? T.text, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

function RoundBadge({ round }: { round: RoundName }) {
  // Show special label for champion (final round + finalized would be handled by status badge)
  const label = ROUND_LABELS[round] ?? round;
  const color = ROUND_COLORS[round] ?? T.muted;
  const bg = ROUND_BADGE_BG[round] ?? "rgba(255,255,255,0.06)";
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 6,
      fontSize: 11, fontWeight: 700, color, background: bg,
      border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: T.muted }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: 6, borderRadius: 4, background: color, width: `${pct}%`, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function MaturityBar({ value }: { value: number }) {
  const color = value >= 80 ? T.green : value >= 50 ? T.yellow : T.accent;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: T.muted }}>성숙도</span>
        <span style={{ color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: 8, borderRadius: 4, background: color, width: `${value}%`, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function BreakthroughCard({ item }: { item: Breakthrough }) {
  const [archOpen, setArchOpen] = useState(false);
  const agents = (item.team?.agent_ids ?? []).map(id => getAgent(id)).filter(Boolean);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
      {/* Title + badges row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0, flex: 1, minWidth: 200 }}>
          {item.title}
        </h3>
        <RoundBadge round={item.round_reached} />
        <span style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 6,
          fontSize: 11, fontWeight: 700,
          color: item.finalized ? T.green : T.accent,
          background: item.finalized ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
          border: `1px solid ${item.finalized ? T.green : T.accent}33`,
        }}>
          {item.finalized ? "완성됨" : "재도전 가능"}
        </span>
      </div>

      {/* Season + team info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        {item.tournament && (
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
            시즌 {item.tournament.season}
          </span>
        )}
        {item.team && (
          <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
            {item.team.team_name}
          </span>
        )}
        <div style={{ display: "flex", gap: 4 }}>
          {agents.map(a => a && (
            <span key={a.id} title={`${a.emoji} ${a.nameKo} (${a.specialty})`} style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "2px 8px", borderRadius: 12,
              fontSize: 11, background: "rgba(255,255,255,0.06)", color: T.text,
            }}>
              {a.emoji} {a.nameKo}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, margin: "0 0 14px" }}>
        {item.summary}
      </p>

      {/* Architecture (collapsible) */}
      {item.architecture && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setArchOpen(v => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 12, color: T.accent, fontWeight: 600,
            }}
          >
            {archOpen ? "▾ 아키텍처 접기" : "▸ 아키텍처 펼치기"}
          </button>
          {archOpen && (
            <div style={{
              marginTop: 8, padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
              fontSize: 12, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {item.architecture}
            </div>
          )}
        </div>
      )}

      {/* Code snippet */}
      {item.code_snippet && (
        <div style={{
          marginBottom: 14, padding: "14px 16px", borderRadius: 10,
          background: "#0a0e1a", border: `1px solid ${T.border}`,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12, color: "#a5d6ff", lineHeight: 1.6,
          whiteSpace: "pre-wrap", overflowX: "auto",
        }}>
          {item.code_snippet}
        </div>
      )}

      {/* Tech stack tags */}
      {item.tech_stack.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {item.tech_stack.map(tech => (
            <span key={tech} style={{
              display: "inline-block", padding: "3px 10px", borderRadius: 20,
              fontSize: 11, fontWeight: 600, color: T.blue,
              background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
            }}>
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Score breakdown */}
      {item.scores && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>
            점수 ({item.scores.total}/100)
          </div>
          {SCORE_LABELS.map(({ key, label, max, color }) => (
            <ScoreBar key={key} label={label} value={item.scores![key]} max={max} color={color} />
          ))}
        </div>
      )}

      {/* Maturity bar */}
      <MaturityBar value={item.maturity} />

      {/* Develop history */}
      {item.parent && (
        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 8,
          background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)",
          fontSize: 12, color: T.muted,
        }}>
          <span style={{ fontWeight: 700, color: T.accent }}>디벨롭 이력</span>
          {" — 원본: "}
          <span style={{ color: T.text, fontWeight: 600 }}>{item.parent.title}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────── */

type RoundFilter = "all" | "semi" | "final";
type FinalizedFilter = "all" | "yes" | "no";

export default function AdminLabPage() {
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [breakthroughs, setBreakthroughs] = useState<Breakthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [roundFilter, setRoundFilter] = useState<RoundFilter>("all");
  const [seasonFilter, setSeasonFilter] = useState<number | "all">("all");
  const [finalizedFilter, setFinalizedFilter] = useState<FinalizedFilter>("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/lab/breakthroughs", { credentials: "include" });
      if (!r.ok) { setError("데이터 로드 실패"); return; }
      const data = await r.json();
      setKpi(data.kpi);
      setBreakthroughs(data.breakthroughs ?? []);
    } catch { setError("네트워크 오류"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Derive unique seasons
  const seasons = [...new Set(breakthroughs.map(b => b.tournament?.season).filter((s): s is number => s != null))].sort((a, b) => b - a);

  // Apply filters
  const filtered = breakthroughs.filter(b => {
    if (roundFilter !== "all" && b.round_reached !== roundFilter) return false;
    if (seasonFilter !== "all" && b.tournament?.season !== seasonFilter) return false;
    if (finalizedFilter === "yes" && !b.finalized) return false;
    if (finalizedFilter === "no" && b.finalized) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: T.surface, color: T.text, border: `1px solid ${T.border}`,
    cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0 }}>
            {"🔬"} 개발실 — 혁신 기술 현황
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
            4강 이상 혁신 기술 · 완성 현황 · 디벨롭 이력
          </p>
        </div>
        <button onClick={load} style={{
          background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 8, padding: "7px 16px", fontSize: 13, color: T.accent,
          cursor: "pointer", fontWeight: 600,
        }}>
          새로고침
        </button>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 14, textAlign: "center", padding: 60 }}>로딩 중...</div>
      ) : error ? (
        <div style={{ color: T.red, fontSize: 14, padding: 20 }}>{error}</div>
      ) : (
        <>
          {/* KPI Cards */}
          {kpi && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <KpiCard title="전체 시즌 수" value={kpi.totalTournaments} />
              <KpiCard title="총 혁신 수" value={kpi.totalInnovations} color={T.blue} />
              <KpiCard title="4강+ 혁신 수" value={kpi.breakthroughCount} color={T.accent} />
              <KpiCard title="완성 기술 수" value={kpi.finalizedCount} color={T.green} />
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>필터:</div>

            {/* Round filter */}
            <select
              value={roundFilter}
              onChange={e => setRoundFilter(e.target.value as RoundFilter)}
              style={selectStyle}
            >
              <option value="all">라운드 전체</option>
              <option value="semi">4강</option>
              <option value="final">결승</option>
            </select>

            {/* Season filter */}
            <select
              value={seasonFilter}
              onChange={e => {
                const v = e.target.value;
                setSeasonFilter(v === "all" ? "all" : Number(v));
              }}
              style={selectStyle}
            >
              <option value="all">시즌 전체</option>
              {seasons.map(s => (
                <option key={s} value={s}>시즌 {s}</option>
              ))}
            </select>

            {/* Finalized filter */}
            <select
              value={finalizedFilter}
              onChange={e => setFinalizedFilter(e.target.value as FinalizedFilter)}
              style={selectStyle}
            >
              <option value="all">완성 여부 전체</option>
              <option value="yes">완성됨</option>
              <option value="no">미완성</option>
            </select>

            <div style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>
              {filtered.length}건
            </div>
          </div>

          {/* Breakthrough Cards */}
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: 60, color: T.muted, fontSize: 14,
              background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
            }}>
              {breakthroughs.length === 0
                ? "아직 4강 이상 진출한 혁신 기술이 없습니다."
                : "필터 조건에 맞는 혁신 기술이 없습니다."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map(item => (
                <BreakthroughCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
