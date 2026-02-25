"use client";

import React, { useState } from "react";
import { T } from "./workspace.constants";
import { useEnvStore, useUiStore } from "./stores";

export function EnvPanel() {
  // Stores
  const envVars = useEnvStore(s => s.envVars);
  const setEnvVars = useEnvStore(s => s.setEnvVars);
  const setShowEnvPanel = useUiStore(s => s.setShowEnvPanel);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const entries = Object.entries(envVars);

  const updateKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(envVars)) {
      next[k === oldKey ? newKey : k] = v;
    }
    setEnvVars(next);
  };

  const updateValue = (key: string, value: string) => {
    setEnvVars({ ...envVars, [key]: value });
  };

  const addVar = () => {
    let idx = entries.length + 1;
    let key = `NEW_VAR_${idx}`;
    while (envVars[key] !== undefined) { idx++; key = `NEW_VAR_${idx}`; }
    setEnvVars({ ...envVars, [key]: "" });
  };

  const deleteVar = (key: string) => {
    const next = { ...envVars };
    delete next[key];
    setEnvVars(next);
  };

  const toggleVisible = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onClose = () => setShowEnvPanel(false);

  const inputBase: React.CSSProperties = {
    height: 32, padding: "0 8px", fontSize: 12, border: `1px solid ${T.border}`,
    borderRadius: 6, background: "#f3f4f6", color: T.text,
    fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
    outline: "none", transition: "border-color 0.15s", width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 340, maxWidth: "100%",
      background: "#0d1117", borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 40,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83D\uDD11"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>환경변수</span>
          {entries.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.accent,
              background: `${T.accent}20`, padding: "2px 7px", borderRadius: 8,
            }}>{entries.length}</span>
          )}
        </div>
        <button onClick={onClose} aria-label="환경변수 패널 닫기"
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
        >{"\u2715"}</button>
      </div>

      {/* Variable list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {entries.length === 0 && (
          <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "24px 0", lineHeight: 1.7 }}>
            환경변수가 없습니다.<br />아래 버튼으로 추가하세요.
          </div>
        )}
        {entries.map(([key, value], i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
            <input
              value={key} placeholder="KEY"
              onChange={e => updateKey(key, e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
              style={{ ...inputBase, flex: 1, fontWeight: 600 }}
            />
            <div style={{ position: "relative", flex: 1.5, display: "flex", alignItems: "center" }}>
              <input
                value={value} placeholder="value"
                type={visibleKeys[key] ? "text" : "password"}
                onChange={e => updateValue(key, e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                style={{ ...inputBase, paddingRight: 28 }}
              />
              <button onClick={() => toggleVisible(key)} aria-label={visibleKeys[key] ? "값 숨기기" : "값 보기"}
                style={{
                  position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: T.muted, cursor: "pointer",
                  fontSize: 11, padding: "2px 4px", lineHeight: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
              >{visibleKeys[key] ? "\uD83D\uDC41" : "\u25CF\u25CF"}</button>
            </div>
            <button onClick={() => deleteVar(key)} aria-label={`${key} 삭제`}
              style={{
                background: "none", border: "none", color: T.muted, cursor: "pointer",
                fontSize: 14, padding: "4px", lineHeight: 1, flexShrink: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = T.red; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
            >{"\uD83D\uDDD1\uFE0F"}</button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button onClick={addVar}
          style={{
            width: "100%", padding: "8px 0", fontSize: 12, fontWeight: 700,
            background: "#f3f4f6", border: `1px dashed ${T.border}`,
            borderRadius: 8, color: T.accent, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = "rgba(249,115,22,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#f3f4f6"; }}
        >+ 변수 추가</button>
        <div style={{ fontSize: 10, color: T.muted, marginTop: 8, lineHeight: 1.6, textAlign: "center" }}>
          프리뷰에서 <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>window.__ENV.KEY</code>로 접근 가능
        </div>
      </div>
    </div>
  );
}
