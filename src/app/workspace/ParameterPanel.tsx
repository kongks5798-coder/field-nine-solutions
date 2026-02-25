"use client";

import React from "react";
import { T } from "./workspace.constants";
import { useParameterStore, useUiStore } from "./stores";

const AUTONOMY_OPTIONS = [
  { value: "low", label: "Low", hint: "최소 변경" },
  { value: "medium", label: "Mid", hint: "균형 잡힌" },
  { value: "high", label: "High", hint: "자율적" },
  { value: "max", label: "Max", hint: "완전 자율" },
] as const;

const BUILD_OPTIONS = [
  { value: "fast", label: "Fast \u26A1", hint: "빠른 생성" },
  { value: "full", label: "Full \uD83C\uDFD7\uFE0F", hint: "완전한 품질" },
] as const;

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: T.muted,
  textTransform: "uppercase", letterSpacing: "0.06em",
};

const hintStyle: React.CSSProperties = {
  fontSize: 10, color: T.muted, marginTop: 2,
};

function ToggleBtn({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
        border: active ? "none" : `1px solid ${T.border}`,
        background: active ? T.accent : "transparent",
        color: active ? "#fff" : T.muted,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

export function ParameterPanel() {
  // Stores
  const temperature = useParameterStore(s => s.temperature);
  const setTemperature = useParameterStore(s => s.setTemperature);
  const maxTokens = useParameterStore(s => s.maxTokens);
  const setMaxTokens = useParameterStore(s => s.setMaxTokens);
  const customSystemPrompt = useParameterStore(s => s.customSystemPrompt);
  const setCustomSystemPrompt = useParameterStore(s => s.setCustomSystemPrompt);
  const autonomyLevel = useParameterStore(s => s.autonomyLevel);
  const setAutonomyLevel = useParameterStore(s => s.setAutonomyLevel);
  const buildMode = useParameterStore(s => s.buildMode);
  const setBuildMode = useParameterStore(s => s.setBuildMode);

  const showParams = useUiStore(s => s.showParams);
  const setShowParams = useUiStore(s => s.setShowParams);

  if (!showParams) return null;

  const onClose = () => setShowParams(false);

  return (
    <div style={{
      background: "#0d1117", border: `1px solid ${T.border}`, borderRadius: 8,
      padding: 12, maxHeight: 320, overflowY: "auto", marginBottom: 6,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{"\u2699\uFE0F"} AI 설정</span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: T.muted, fontSize: 16,
          cursor: "pointer", padding: "0 2px", lineHeight: 1,
        }}>{"\u00D7"}</button>
      </div>

      {/* Temperature */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Temperature</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <input
            type="range" min={0} max={2} step={0.1}
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: T.accent }}
            aria-label="Temperature"
            aria-valuemin={0} aria-valuemax={2} aria-valuenow={temperature}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 28, textAlign: "right" }}>
            {temperature.toFixed(1)}
          </span>
        </div>
        <div style={hintStyle}>낮을수록 일관된 응답, 높을수록 창의적</div>
      </div>

      {/* Max Tokens */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Max Tokens</label>
        <input
          type="number" min={256} max={16384} step={256}
          value={maxTokens}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) setMaxTokens(Math.max(256, Math.min(16384, v)));
          }}
          aria-label="Max Tokens"
          style={{
            display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6,
            border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.text,
            fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        <div style={hintStyle}>응답 최대 길이</div>
      </div>

      {/* Autonomy Level */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Autonomy</label>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {AUTONOMY_OPTIONS.map(o => (
            <ToggleBtn key={o.value} active={autonomyLevel === o.value}
              onClick={() => setAutonomyLevel(o.value)} title={o.hint}>
              {o.label}
            </ToggleBtn>
          ))}
        </div>
      </div>

      {/* Build Mode */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Build Mode</label>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {BUILD_OPTIONS.map(o => (
            <ToggleBtn key={o.value} active={buildMode === o.value}
              onClick={() => setBuildMode(o.value)} title={o.hint}>
              {o.label}
            </ToggleBtn>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label style={labelStyle}>시스템 프롬프트</label>
        <textarea
          value={customSystemPrompt}
          onChange={e => setCustomSystemPrompt(e.target.value)}
          rows={4}
          placeholder="AI의 행동 지침을 수정하세요..."
          aria-label="시스템 프롬프트"
          style={{
            display: "block", width: "100%", marginTop: 4, padding: "6px 8px", borderRadius: 6,
            border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.text,
            fontSize: 12, resize: "vertical", outline: "none", boxSizing: "border-box",
            fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: 1.5,
          }}
        />
      </div>
    </div>
  );
}
