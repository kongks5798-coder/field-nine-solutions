"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { T, PROVIDER_COLORS } from "./workspace.constants";
import type { AiModelInfo } from "./workspace.constants";

export interface ModelPickerProps {
  models: AiModelInfo[];
  selectedModelId: string;
  onSelect: (modelId: string, provider: string) => void;
  ollamaOnline?: boolean;
}

const SPEED_ICON: Record<string, string> = { fast: "\u26A1", medium: "\uD83D\uDE80", deep: "\uD83E\uDDE0" };
const SPEED_LABEL: Record<string, string> = { fast: "fast", medium: "medium", deep: "deep" };

export function ModelPicker({ models, selectedModelId, onSelect, ollamaOnline }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = models.find(m => m.id === selectedModelId) ?? models[0];
  const providerColor = PROVIDER_COLORS[selected?.provider ?? "openai"] ?? "#60a5fa";

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  // Group models: local (ollama) vs cloud
  const localModels = models.filter(m => m.provider === "ollama");
  const cloudModels = models.filter(m => m.provider !== "ollama");

  const handleSelect = (m: AiModelInfo) => {
    onSelect(m.id, m.provider);
    setOpen(false);
  };

  const renderRow = (m: AiModelInfo) => {
    const isSelected = m.id === selectedModelId;
    const color = PROVIDER_COLORS[m.provider] ?? "#60a5fa";
    return (
      <div
        key={m.id}
        onClick={() => handleSelect(m)}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
          cursor: "pointer", borderRadius: 6, margin: "1px 4px",
          background: "transparent", transition: "background 0.1s",
        }}
      >
        {/* Provider dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: color,
          boxShadow: m.provider === "ollama" && ollamaOnline ? `0 0 6px ${color}` : "none",
          animation: m.provider === "ollama" && ollamaOnline ? "pulse 2s infinite" : "none",
        }} />
        {/* Model name */}
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: T.text }}>{m.label}</span>
        {/* Speed indicator */}
        <span style={{ fontSize: 10, color: T.muted }} title={SPEED_LABEL[m.speed]}>
          {SPEED_ICON[m.speed] ?? ""}{" "}{SPEED_LABEL[m.speed]}
        </span>
        {/* Cost indicator */}
        <span style={{
          fontSize: 10, fontWeight: 600, minWidth: 28, textAlign: "right",
          color: m.cost === "free" ? T.green : m.cost === "$" ? "#94a3b8" : m.cost === "$$" ? T.warn : T.accent,
        }}>
          {m.cost === "free" ? "free" : m.cost}
        </span>
        {/* Checkmark */}
        {isSelected && (
          <span style={{ fontSize: 12, color: T.green, flexShrink: 0 }}>&#10003;</span>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 7,
          border: `1px solid ${T.border}`,
          background: "#f3f4f6",
          color: T.text, fontSize: 11, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          transition: "border-color 0.15s",
          borderColor: open ? "rgba(0,0,0,0.08)" : T.border,
        }}
      >
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: providerColor, flexShrink: 0,
        }} />
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected?.label ?? "Model"}
        </span>
        <span style={{ fontSize: 9, color: T.muted, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>
          &#9662;
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#ffffff", border: `1px solid ${T.border}`,
          borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          zIndex: 400, minWidth: 280, maxWidth: 340,
          overflow: "hidden",
        }}>
          {/* Local section (Ollama) */}
          {localModels.length > 0 && (
            <>
              <div style={{
                padding: "8px 14px 4px", fontSize: 10, fontWeight: 700,
                color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                Local
                {ollamaOnline && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#22c55e", display: "inline-block",
                    boxShadow: "0 0 6px #22c55e",
                  }} />
                )}
              </div>
              <div style={{ padding: "2px 0" }}>
                {localModels.map(renderRow)}
              </div>
              <div style={{ height: 1, background: T.border, margin: "2px 12px" }} />
            </>
          )}

          {/* Cloud section */}
          <div style={{
            padding: `${localModels.length > 0 ? "6px" : "8px"} 14px 4px`,
            fontSize: 10, fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            Cloud
          </div>
          <div style={{ padding: "2px 0 6px", maxHeight: 300, overflowY: "auto" }}>
            {cloudModels.map(renderRow)}
          </div>
        </div>
      )}

      {/* Pulse animation for Ollama online dot */}
      {open && ollamaOnline && (
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      )}
    </div>
  );
}
