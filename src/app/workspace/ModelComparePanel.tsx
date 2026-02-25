"use client";

import React, { useState } from "react";
import { T, AI_MODELS, PROVIDER_COLORS } from "./workspace.constants";

interface CompareResponse {
  model: string;
  provider: string;
  text: string;
  latencyMs: number;
  tokenEstimate: number;
  error?: string;
}

export interface ModelComparePanelProps {
  prompt: string;
  models: Array<{ id: string; label: string; provider: string }>;
  onApply: (code: string) => void;
  onClose: () => void;
}

export function ModelComparePanel({ prompt, models, onApply, onClose }: ModelComparePanelProps) {
  const firstOpenAI = models.find(m => m.provider === "openai")?.id ?? "";
  const firstAnthropic = models.find(m => m.provider === "anthropic")?.id ?? "";
  const initSelected = [firstOpenAI, firstAnthropic].filter(Boolean).slice(0, 2);
  const [selected, setSelected] = useState<string[]>(initSelected);
  const [phase, setPhase] = useState<"select" | "loading" | "results">("select");
  const [responses, setResponses] = useState<CompareResponse[]>([]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 4 ? prev : [...prev, id],
    );
  };

  const startCompare = async () => {
    if (selected.length < 2) return;
    setPhase("loading");
    setResponses([]);
    try {
      const body = {
        prompt,
        models: selected.map(id => {
          const m = models.find(x => x.id === id);
          return { id, provider: m?.provider ?? "openai" };
        }),
      };
      const res = await fetch("/api/lm/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponses(data.responses ?? []);
      setPhase("results");
    } catch {
      setPhase("select");
    }
  };

  const handleApply = (text: string) => { onApply(text); onClose(); };

  const labelFor = (id: string) => models.find(m => m.id === id)?.label ?? id;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 700,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)",
    }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cmp-title" style={{
        background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 20,
        padding: "24px 20px", width: 900, maxWidth: "94vw", maxHeight: "85vh",
        overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 id="cmp-title" style={{ fontSize: 16, fontWeight: 900, color: T.text, margin: 0 }}>
            {phase === "select" ? "모델 비교" : phase === "loading" ? "비교 중..." : "비교 결과"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Prompt preview */}
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 14, padding: "8px 10px", background: "#f9fafb", borderRadius: 8, border: `1px solid ${T.border}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <strong style={{ color: T.text }}>프롬프트:</strong> {prompt}
        </div>

        {/* Phase: Model Selection */}
        {phase === "select" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8, marginBottom: 16 }}>
              {AI_MODELS.map(m => {
                const checked = selected.includes(m.id);
                const dotColor = PROVIDER_COLORS[m.provider] ?? T.muted;
                return (
                  <label key={m.id} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                    border: `1px solid ${checked ? T.borderHi : T.border}`, background: checked ? "rgba(249,115,22,0.06)" : "#fafafa",
                    cursor: "pointer", transition: "all 0.12s",
                  }}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(m.id)}
                      style={{ accentColor: T.accent, width: 14, height: 14 }} />
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: T.text, fontWeight: checked ? 700 : 500 }}>{m.label}</span>
                    <span style={{ fontSize: 9, color: T.muted, marginLeft: "auto" }}>{m.cost}</span>
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: T.muted }}>{selected.length}/4 선택 (최소 2개)</span>
              <button onClick={startCompare} disabled={selected.length < 2} style={{
                padding: "10px 28px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 13,
                fontFamily: "inherit", cursor: selected.length >= 2 ? "pointer" : "not-allowed",
                background: selected.length >= 2 ? `linear-gradient(135deg,${T.accent},${T.accentB})` : "#e5e7eb",
                color: selected.length >= 2 ? "#fff" : T.muted, transition: "all 0.15s",
              }}>비교 시작</button>
            </div>
          </>
        )}

        {/* Phase: Loading */}
        {phase === "loading" && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`, gap: 12 }}>
            {selected.map(id => (
              <div key={id} style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>{labelFor(id)}</div>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: 12, borderRadius: 4, background: "#f3f4f6", marginBottom: 8, animation: `pulse 1.5s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Phase: Results */}
        {phase === "results" && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`, gap: 12 }}>
            {responses.map((r, i) => {
              const dotColor = PROVIDER_COLORS[r.provider] ?? T.muted;
              return (
                <div key={i} style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{labelFor(r.model)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 10, color: T.muted }}>
                    <span>{(r.latencyMs / 1000).toFixed(1)}초</span>
                    <span>~{r.tokenEstimate} 토큰</span>
                  </div>
                  {r.error ? (
                    <div style={{ fontSize: 11, color: T.red, padding: "8px 10px", background: "rgba(248,113,113,0.08)", borderRadius: 6 }}>{r.error}</div>
                  ) : (
                    <pre style={{
                      flex: 1, margin: 0, padding: 10, fontSize: 10.5, lineHeight: 1.6,
                      color: "#c9d1d9", fontFamily: '"JetBrains Mono","Fira Code",monospace',
                      background: "#fafafa", borderRadius: 6, border: `1px solid ${T.border}`,
                      whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 300, overflowY: "auto",
                    }}>{r.text}</pre>
                  )}
                  {!r.error && r.text && (
                    <button onClick={() => handleApply(r.text)} style={{
                      marginTop: 10, padding: "8px 0", borderRadius: 8, border: "none", fontWeight: 700,
                      fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff",
                    }}>적용</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back to selection from results */}
        {phase === "results" && (
          <button onClick={() => setPhase("select")} style={{
            marginTop: 14, padding: "8px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
            background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>다시 선택</button>
        )}
      </div>
    </div>
  );
}
