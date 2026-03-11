"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Feature {
  id: string;
  label: string;
  effort: "S" | "M" | "L" | "XL";
  impact: "Low" | "Mid" | "High" | "Critical";
  done?: boolean;
}

interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  features: Feature[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: "foundation",
    number: 1,
    title: "Foundation",
    subtitle: "코어 기반 — 지금 여기",
    emoji: "🏗️",
    color: "#22c55e",
    features: [
      { id: "f1",  label: "AI 앱 생성 (HTML/CSS/JS)",                        effort: "L",  impact: "Critical", done: true },
      { id: "f2",  label: "3-Agent 병렬 빌더 (Architect→Builder→Critic)",     effort: "XL", impact: "Critical", done: true },
      { id: "f3",  label: "Pass 1/2/3 자동 치유 (JS SyntaxError)",            effort: "L",  impact: "High",     done: true },
      { id: "f4",  label: "Edit Mode — 수정 채팅 (isEditRequest)",             effort: "M",  impact: "High",     done: true },
      { id: "f5",  label: "Auto-fix 루프 보호 (MAX_AUTO_FIX=3)",              effort: "S",  impact: "High",     done: true },
      { id: "f6",  label: "라이브 프리뷰 (iframe sandbox)",                    effort: "M",  impact: "Critical", done: true },
      { id: "f7",  label: "프로젝트 배포 (Supabase + 익명/인증)",              effort: "L",  impact: "Critical", done: true },
      { id: "f8",  label: "결제 (Toss Payments — 토큰 구매)",                  effort: "L",  impact: "High",     done: true },
      { id: "f9",  label: "49개 앱 템플릿",                                    effort: "M",  impact: "High",     done: true },
      { id: "f10", label: "Git 연동 (기본)",                                   effort: "M",  impact: "Mid",      done: true },
      { id: "f11", label: "반응형 모바일 UI",                                  effort: "M",  impact: "Mid"              },
      { id: "f12", label: "수정 모드 배지 UI (✏️ Edit Mode 표시)",             effort: "S",  impact: "Low"              },
      { id: "f13", label: "생성 후 제안 칩 3개",                               effort: "S",  impact: "Mid"              },
    ],
  },
  {
    id: "execution",
    number: 2,
    title: "Real Execution",
    subtitle: "실제 코드 실행 환경 (E2B)",
    emoji: "⚡",
    color: "#f97316",
    features: [
      { id: "e1", label: "E2B Sandbox 연동 (Node.js 실행)",        effort: "XL", impact: "Critical" },
      { id: "e2", label: "인브라우저 터미널 (xterm.js)",            effort: "L",  impact: "Critical" },
      { id: "e3", label: "npm install 지원 (package.json)",         effort: "L",  impact: "High"     },
      { id: "e4", label: "실행 결과 → 프리뷰 자동 반영",           effort: "M",  impact: "High"     },
      { id: "e5", label: "에러 스택 → AI 자동 수정",               effort: "M",  impact: "High"     },
      { id: "e6", label: "실행 환경 선택 (Browser / Node / Deno)", effort: "M",  impact: "Mid"      },
      { id: "e7", label: "환경 변수 주입 (Secrets)",               effort: "S",  impact: "Mid"      },
    ],
  },
  {
    id: "multilang",
    number: 3,
    title: "Multi-Language",
    subtitle: "Python · Node · Go · Rust 지원",
    emoji: "🌐",
    color: "#a855f7",
    features: [
      { id: "m1", label: "Python 런타임 (Pyodide or E2B)",    effort: "XL", impact: "Critical" },
      { id: "m2", label: "언어 자동 감지 (프롬프트 파싱)",    effort: "S",  impact: "High"     },
      { id: "m3", label: "멀티파일 프로젝트 (파일 트리)",     effort: "L",  impact: "Critical" },
      { id: "m4", label: "탭 에디터 (Monaco Editor)",         effort: "L",  impact: "High"     },
      { id: "m5", label: "폴더 구조 생성·삭제·이름변경",      effort: "M",  impact: "High"     },
      { id: "m6", label: "import/require 자동 해결",          effort: "L",  impact: "Mid"      },
      { id: "m7", label: "언어별 신택스 하이라이팅",          effort: "S",  impact: "Mid"      },
    ],
  },
  {
    id: "collab",
    number: 4,
    title: "Collaboration",
    subtitle: "실시간 협업 (Yjs / PartyKit)",
    emoji: "👥",
    color: "#06b6d4",
    features: [
      { id: "c1", label: "실시간 공동편집 (Yjs CRDT)",           effort: "XL", impact: "Critical" },
      { id: "c2", label: "멀티플레이어 커서 표시",               effort: "M",  impact: "High"     },
      { id: "c3", label: "팀 워크스페이스 (초대 링크)",          effort: "M",  impact: "High"     },
      { id: "c4", label: "채팅 — 코드 코멘트",                   effort: "M",  impact: "Mid"      },
      { id: "c5", label: "권한 관리 (Owner / Editor / Viewer)", effort: "M",  impact: "Mid"      },
      { id: "c6", label: "변경 이력 (Time Machine)",             effort: "L",  impact: "Mid"      },
    ],
  },
  {
    id: "platform",
    number: 5,
    title: "Platform",
    subtitle: "커스텀 도메인 · DB · 배포 자동화",
    emoji: "🚀",
    color: "#eab308",
    features: [
      { id: "p1", label: "커스텀 도메인 연결 (Vercel DNS)",  effort: "L",  impact: "Critical" },
      { id: "p2", label: "내장 DB (SQLite / Postgres)",      effort: "XL", impact: "High"     },
      { id: "p3", label: "Secrets Manager (암호화 env)",     effort: "M",  impact: "High"     },
      { id: "p4", label: "GitHub 자동 sync (push on save)",  effort: "L",  impact: "High"     },
      { id: "p5", label: "CI/CD 파이프라인 뷰어",            effort: "L",  impact: "Mid"      },
      { id: "p6", label: "사용량 분석 대시보드",             effort: "M",  impact: "Mid"      },
      { id: "p7", label: "웹훅 + API 키 발급",               effort: "M",  impact: "Mid"      },
    ],
  },
  {
    id: "community",
    number: 6,
    title: "Community",
    subtitle: "템플릿 마켓 · 포크 · 바이럴",
    emoji: "🌟",
    color: "#ec4899",
    features: [
      { id: "co1", label: "공개 갤러리 (오늘의 딸깍 확장)",      effort: "M", impact: "High", done: true },
      { id: "co2", label: "프로젝트 포크 (1클릭 복제)",          effort: "S", impact: "High"             },
      { id: "co3", label: "템플릿 마켓 (유료 판매 가능)",        effort: "L", impact: "High"             },
      { id: "co4", label: "좋아요 · 댓글 · 팔로우",              effort: "M", impact: "Mid"              },
      { id: "co5", label: "임베드 위젯 (외부 사이트)",           effort: "S", impact: "Mid"              },
      { id: "co6", label: "바이럴 배지 (배포 앱에 딸깍 로고)",   effort: "S", impact: "Mid",  done: true },
    ],
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "dalkak_roadmap_v1";

const EFFORT_META: Record<string, { color: string; label: string }> = {
  S:  { color: "#22c55e", label: "1-2일" },
  M:  { color: "#eab308", label: "3-5일" },
  L:  { color: "#f97316", label: "1-2주" },
  XL: { color: "#ef4444", label: "3-4주+" },
};

const IMPACT_META: Record<string, { bg: string; fg: string }> = {
  Critical: { bg: "rgba(239,68,68,0.15)",    fg: "#ef4444" },
  High:     { bg: "rgba(249,115,22,0.15)",   fg: "#f97316" },
  Mid:      { bg: "rgba(234,179,8,0.15)",    fg: "#eab308" },
  Low:      { bg: "rgba(148,163,184,0.10)", fg: "#94a3b8" },
};

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveChecked(state: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full — silently ignore
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true">
      <path
        d="M1 4L4 7L10 1"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FeatureRowProps {
  feature: Feature;
  isChecked: boolean;
  phaseColor: string;
  onToggle: (id: string) => void;
  isLast: boolean;
}

function FeatureRow({ feature, isChecked, phaseColor, onToggle, isLast }: FeatureRowProps) {
  const effort = EFFORT_META[feature.effort];
  const impact = IMPACT_META[feature.impact];

  return (
    <div
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onClick={() => onToggle(feature.id)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(feature.id);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        cursor: "pointer",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        opacity: isChecked ? 0.55 : 1,
        transition: "opacity 0.2s ease",
        outline: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Custom checkbox */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: isChecked
            ? `2px solid ${phaseColor}`
            : "2px solid rgba(255,255,255,0.18)",
          background: isChecked ? phaseColor + "30" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {isChecked && <CheckIcon color={phaseColor} />}
      </div>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          lineHeight: 1.5,
          textDecoration: isChecked ? "line-through" : "none",
          color: isChecked ? "#475569" : "#cbd5e1",
          transition: "color 0.2s ease",
          minWidth: 0,
          wordBreak: "keep-all",
        }}
      >
        {feature.label}
      </span>

      {/* Tags */}
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            color: effort.color,
            background: effort.color + "18",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
          }}
        >
          {feature.effort}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 4,
            color: impact.fg,
            background: impact.bg,
            whiteSpace: "nowrap",
          }}
        >
          {feature.impact}
        </span>
      </div>
    </div>
  );
}

interface PhaseCardProps {
  phase: Phase;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

function PhaseCard({ phase, checked, onToggle }: PhaseCardProps) {
  const donePh = phase.features.filter((f) => checked[f.id]).length;
  const pctPh = Math.round((donePh / phase.features.length) * 100);
  const isComplete = pctPh === 100;

  return (
    <div
      style={{
        background: "#0d1117",
        border: `1px solid ${isComplete ? phase.color + "55" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.4s ease",
      }}
    >
      {/* Phase header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: phase.color + "1a",
            border: `1px solid ${phase.color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {phase.emoji}
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
              {phase.number}. {phase.title}
            </span>
            {isComplete && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  background: phase.color + "22",
                  color: phase.color,
                  borderRadius: 20,
                  border: `1px solid ${phase.color}44`,
                  letterSpacing: 0.4,
                }}
              >
                완료 ✓
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{phase.subtitle}</div>
        </div>

        {/* Percent */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: phase.color, lineHeight: 1 }}>
            {pctPh}%
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {donePh}/{phase.features.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
        <div
          style={{
            height: "100%",
            width: `${pctPh}%`,
            background: phase.color,
            transition: "width 0.35s ease",
          }}
        />
      </div>

      {/* Feature list */}
      <div style={{ padding: "8px 20px 12px" }}>
        {phase.features.map((f, idx) => (
          <FeatureRow
            key={f.id}
            feature={f}
            isChecked={!!checked[f.id]}
            phaseColor={phase.color}
            onToggle={onToggle}
            isLast={idx === phase.features.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = loadChecked();
    const init: Record<string, boolean> = {};
    for (const phase of PHASES) {
      for (const f of phase.features) {
        init[f.id] =
          stored[f.id] !== undefined ? stored[f.id] : (f.done ?? false);
      }
    }
    setChecked(init);
    setMounted(true);
  }, []);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveChecked(next);
      return next;
    });
  }, []);

  const allFeatures = PHASES.flatMap((p) => p.features);
  const totalDone = allFeatures.filter((f) => checked[f.id]).length;
  const totalAll = allFeatures.length;
  const overallPct = Math.round((totalDone / totalAll) * 100);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #050508;
        }

        /* Checkbox row hover */
        [role="checkbox"]:hover {
          background: rgba(255,255,255,0.025);
          border-radius: 8px;
        }

        [role="checkbox"]:focus-visible {
          outline: 2px solid rgba(255,255,255,0.3);
          border-radius: 8px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

        @media (max-width: 640px) {
          .roadmap-header h1 { font-size: 22px !important; }
          .roadmap-overall { padding: 18px 16px !important; }
          .roadmap-phase-mini { display: none !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          color: "#f0f4f8",
          fontFamily: "'Pretendard', 'Apple SD Gothic Neo', system-ui, sans-serif",
          padding: "36px 16px 80px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Back link */}
          <a
            href="/"
            style={{
              color: "#475569",
              textDecoration: "none",
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 20,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#94a3b8")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#475569")}
          >
            ← 딸깍으로 돌아가기
          </a>

          {/* Title */}
          <div className="roadmap-header">
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: "0 0 6px",
                letterSpacing: -0.7,
                color: "#f8fafc",
              }}
            >
              🗺️ Replit 로드맵 트래커
            </h1>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 28px", lineHeight: 1.6 }}>
              딸깍 → Replit 수준 도달까지의 진행 상황.&nbsp;
              체크박스 클릭 시 자동 저장됩니다.
            </p>
          </div>

          {/* ── Overall progress card ── */}
          <div
            className="roadmap-overall"
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "22px 24px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 14,
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  전체 완성도
                </div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: -2,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {overallPct}
                  <span style={{ fontSize: 18, fontWeight: 500, color: "#475569" }}>%</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>완료 항목</div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {totalDone}
                  <span style={{ color: "#334155", fontWeight: 400 }}> / {totalAll}</span>
                </div>
              </div>
            </div>

            {/* Main progress bar */}
            <div
              style={{
                height: 10,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${overallPct}%`,
                  background: "linear-gradient(90deg, #f97316 0%, #eab308 100%)",
                  borderRadius: 5,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Phase mini-bars */}
            <div
              className="roadmap-phase-mini"
              style={{ display: "flex", gap: 6, marginTop: 8 }}
            >
              {PHASES.map((phase) => {
                const done = phase.features.filter((f) => checked[f.id]).length;
                const pct = Math.round((done / phase.features.length) * 100);
                return (
                  <div key={phase.id} style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: phase.color,
                          borderRadius: 2,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#334155",
                        marginTop: 4,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {phase.number}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Phase cards ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PHASES.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                checked={checked}
                onToggle={toggle}
              />
            ))}
          </div>

          {/* ── Legend ── */}
          <div
            style={{
              marginTop: 28,
              padding: "18px 24px",
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
              fontSize: 12,
              color: "#64748b",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: 8,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Effort
              </div>
              {Object.entries(EFFORT_META).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 2,
                      background: v.color,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    <b style={{ color: v.color }}>{k}</b>
                    {" "}— {v.label}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: 8,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Impact
              </div>
              {Object.entries(IMPACT_META).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 2,
                      background: v.fg,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: v.fg }}>{k}</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#94a3b8",
                  marginBottom: 8,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                사용법
              </div>
              <div style={{ lineHeight: 1.9, color: "#475569" }}>
                • 항목 클릭 → 완료 표시 (자동 저장)
                <br />
                • Space / Enter 키보드 접근 지원
                <br />
                • 상태는 브라우저에 영구 저장
                <br />• Phase 완료 시 카드 테두리 색상 변경
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
