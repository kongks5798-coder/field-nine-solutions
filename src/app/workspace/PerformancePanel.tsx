"use client";

import React, { useState, useCallback } from "react";
import { T } from "./workspace.constants";
import { useFileSystemStore, useUiStore } from "./stores";

// Lazy import profiler
type PerformanceReport = {
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number; overall: number };
  issues: { category: string; severity: string; message: string; suggestion: string; lineRef?: number }[];
  grade: string;
  summary: string;
};

export interface PerformancePanelProps {
  onClose: () => void;
}

export function PerformancePanel({ onClose }: PerformancePanelProps) {
  const files = useFileSystemStore(s => s.files);
  const showToast = useUiStore(s => s.showToast);

  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const runProfile = useCallback(async () => {
    setScanning(true);
    try {
      const { profilePerformance } = await import("./ai/performanceProfiler");
      const fileContents: Record<string, { content: string }> = {};
      for (const [k, v] of Object.entries(files)) fileContents[k] = { content: v.content };
      const r = profilePerformance(fileContents);
      setReport(r);
      showToast(`성능 분석 완료: ${r.grade} (${r.scores.overall}/100)`);
    } catch (err) {
      showToast(`분석 실패: ${String(err)}`);
    } finally {
      setScanning(false);
    }
  }, [files, showToast]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return T.green;
    if (score >= 50) return T.accent;
    return T.red;
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A" || grade === "A+") return T.green;
    if (grade === "B" || grade === "B+") return "#22d3ee";
    if (grade === "C") return T.accent;
    return T.red;
  };

  const getSeverityColor = (sev: string) => {
    if (sev === "critical") return T.red;
    if (sev === "warning") return T.accent;
    return T.info;
  };

  const categories = [
    { key: "performance", label: "성능", icon: "\u26A1" },
    { key: "accessibility", label: "접근성", icon: "\u267F" },
    { key: "bestPractices", label: "모범 사례", icon: "\u2705" },
    { key: "seo", label: "SEO", icon: "\uD83D\uDD0D" },
  ];

  const ScoreCircle = ({ score, size = 60, label }: { score: number; size?: number; label: string }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e5e7eb" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
            fill={color} fontSize={size > 50 ? 16 : 12} fontWeight={700}
            fontFamily="inherit"
            style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
            {score}
          </text>
        </svg>
        <span style={{ fontSize: 9, color: T.muted, fontWeight: 600 }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 400, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83D\uDCC8"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>성능 프로파일러</span>
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
        {/* Scan button */}
        <button onClick={runProfile} disabled={scanning}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: scanning ? T.muted : `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: scanning ? "default" : "pointer",
            fontFamily: "inherit", marginBottom: 16,
            boxShadow: scanning ? "none" : "0 2px 14px rgba(249,115,22,0.25)",
          }}>
          {scanning ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              분석 중...
            </span>
          ) : "Lighthouse 분석 실행"}
        </button>

        {!report && !scanning && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            코드의 성능, 접근성, SEO, 모범사례를<br />
            Lighthouse 스타일로 분석합니다.
          </div>
        )}

        {report && (
          <>
            {/* Overall grade */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px 0", marginBottom: 14,
              background: `${getGradeColor(report.grade)}08`,
              border: `1px solid ${getGradeColor(report.grade)}25`,
              borderRadius: 12,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 36, fontWeight: 900, color: getGradeColor(report.grade),
                  lineHeight: 1,
                }}>{report.grade}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                  종합 {report.scores.overall}/100
                </div>
              </div>
            </div>

            {/* Score circles */}
            <div style={{
              display: "flex", justifyContent: "space-around",
              marginBottom: 16, padding: "8px 0",
            }}>
              {categories.map(cat => (
                <ScoreCircle
                  key={cat.key}
                  score={report.scores[cat.key as keyof typeof report.scores]}
                  size={56}
                  label={cat.label}
                />
              ))}
            </div>

            {/* Summary */}
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: "#f9fafb", border: `1px solid ${T.border}`,
              fontSize: 11, color: T.text, lineHeight: 1.6, marginBottom: 14,
            }}>
              {report.summary}
            </div>

            {/* Issues by category */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: "0.04em" }}>
              {report.issues.length}개 이슈 발견
            </div>

            {categories.map(cat => {
              const catIssues = report.issues.filter(i => i.category === cat.key);
              if (catIssues.length === 0) return null;
              const isExpanded = expandedCat === cat.key;
              return (
                <div key={cat.key} style={{ marginBottom: 6 }}>
                  <button onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: `1px solid ${isExpanded ? T.borderHi : T.border}`,
                      background: isExpanded ? `${T.accent}06` : "#f9fafb",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      fontFamily: "inherit", textAlign: "left",
                    }}>
                    <span>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>{cat.label}</span>
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4,
                      background: `${getScoreColor(report.scores[cat.key as keyof typeof report.scores])}15`,
                      color: getScoreColor(report.scores[cat.key as keyof typeof report.scores]),
                      fontWeight: 700,
                    }}>
                      {report.scores[cat.key as keyof typeof report.scores]}
                    </span>
                    <span style={{ fontSize: 10, color: T.muted }}>{catIssues.length}</span>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: "4px 0 4px 12px", borderLeft: `2px solid ${T.border}`, marginLeft: 18 }}>
                      {catIssues.map((issue, i) => (
                        <div key={i} style={{
                          padding: "6px 8px", marginBottom: 4, borderRadius: 6,
                          background: `${getSeverityColor(issue.severity)}06`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{
                              fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                              background: `${getSeverityColor(issue.severity)}15`,
                              color: getSeverityColor(issue.severity),
                              textTransform: "uppercase",
                            }}>{issue.severity}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{issue.message}</span>
                          </div>
                          <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5, paddingLeft: 2 }}>
                            {issue.suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
