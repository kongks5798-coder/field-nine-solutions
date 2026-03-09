"use client";

import { useState, useEffect, useRef } from "react";
import type { ArchitectSpec } from "./ai/teamPipeline";

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTO_SKIP_SECONDS = 8;

const LAYOUT_OPTIONS: { value: ArchitectSpec["layout"]; label: string }[] = [
  { value: "single-page", label: "단일 페이지" },
  { value: "multi-section", label: "멀티 섹션" },
  { value: "dashboard", label: "대시보드" },
  { value: "landing", label: "랜딩" },
  { value: "app", label: "앱" },
];

// ── Color swatch entries ───────────────────────────────────────────────────────

type ColorKey = keyof ArchitectSpec["colorScheme"];

const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "primary",    label: "Primary" },
  { key: "background", label: "배경" },
  { key: "surface",    label: "Surface" },
  { key: "text",       label: "텍스트" },
  { key: "accent",     label: "Accent" },
];

// ── Inline styles ─────────────────────────────────────────────────────────────

const BACKDROP: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9000,
  background: "rgba(0,0,0,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};

const PANEL: React.CSSProperties = {
  background: "#0f0f1a",
  border: "1px solid rgba(249,115,22,0.25)",
  borderRadius: 14,
  width: "100%",
  maxWidth: 480,
  maxHeight: "90vh",
  overflowY: "auto",
  fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
  boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
};

const HEADER: React.CSSProperties = {
  padding: "18px 20px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const SECTION: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.8,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  marginBottom: 10,
};

const CHIP_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "4px 10px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "background 0.15s, color 0.15s",
};

const FOOTER: React.CSSProperties = {
  padding: "14px 20px",
  display: "flex",
  gap: 8,
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  spec: ArchitectSpec;
  onConfirm: (spec: ArchitectSpec) => void;
  onSkip: () => void;
  isOpen: boolean;
}

// ── Feature chip component ────────────────────────────────────────────────────

function FeatureChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 9999,
        background: "rgba(249,115,22,0.12)",
        border: "1px solid rgba(249,115,22,0.3)",
        color: "#f97316",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 제거`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#f97316",
          fontSize: 13,
          lineHeight: 1,
          padding: 0,
          marginLeft: 2,
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ArchitectSpecEditor({ spec, onConfirm, onSkip, isOpen }: Props) {
  const [editedSpec, setEditedSpec] = useState<ArchitectSpec>(spec);
  const [countdown, setCountdown] = useState(AUTO_SKIP_SECONDS);
  const [newFeature, setNewFeature] = useState("");

  // Track whether user has interacted (resets auto-skip timer)
  const hasInteracted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when spec changes (new generation)
  useEffect(() => {
    setEditedSpec(spec);
    setCountdown(AUTO_SKIP_SECONDS);
    hasInteracted.current = false;
    setNewFeature("");
  }, [spec]);

  // Auto-skip countdown — pauses on interaction
  useEffect(() => {
    if (!isOpen) return;

    timerRef.current = setInterval(() => {
      if (hasInteracted.current) {
        // User is interacting — freeze countdown at current value
        return;
      }
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleInteraction = () => {
    hasInteracted.current = true;
  };

  const setColor = (key: ColorKey, value: string) => {
    handleInteraction();
    setEditedSpec(prev => ({
      ...prev,
      colorScheme: { ...prev.colorScheme, [key]: value },
    }));
  };

  const setTheme = (theme: ArchitectSpec["theme"]) => {
    handleInteraction();
    setEditedSpec(prev => ({ ...prev, theme }));
  };

  const setLayout = (layout: ArchitectSpec["layout"]) => {
    handleInteraction();
    setEditedSpec(prev => ({ ...prev, layout }));
  };

  const removeFeature = (index: number) => {
    handleInteraction();
    setEditedSpec(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    handleInteraction();
    setEditedSpec(prev => ({
      ...prev,
      features: [...prev.features, trimmed],
    }));
    setNewFeature("");
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFeature();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={BACKDROP} role="dialog" aria-modal="true" aria-label="Architect 스펙 에디터">
      <div style={PANEL} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>

        {/* Header */}
        <div style={HEADER}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#e8eaf0" }}>
              🎯 Architect 스펙 검토
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
              생성 전 설계 스펙을 수정할 수 있습니다
            </div>
          </div>
          {/* Countdown badge */}
          {!hasInteracted.current && (
            <div style={{
              padding: "4px 10px",
              borderRadius: 9999,
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
              fontSize: 12,
              fontWeight: 700,
              color: "#f97316",
            }}>
              {countdown}초 후 자동 진행
            </div>
          )}
        </div>

        {/* 1. Color palette */}
        <div style={SECTION}>
          <div style={SECTION_LABEL}>컬러 팔레트</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: editedSpec.colorScheme[key],
                  border: "2px solid rgba(255,255,255,0.1)",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                }}>
                  <input
                    type="color"
                    value={editedSpec.colorScheme[key]}
                    onChange={e => setColor(key, e.target.value)}
                    aria-label={`${label} 색상`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      padding: 0,
                      border: "none",
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Theme toggle */}
        <div style={SECTION}>
          <div style={SECTION_LABEL}>테마</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["dark", "light"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                style={{
                  ...CHIP_BASE,
                  padding: "7px 18px",
                  background: editedSpec.theme === t ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${editedSpec.theme === t ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                  color: editedSpec.theme === t ? "#f97316" : "#9ca3af",
                  fontSize: 13,
                }}
              >
                {t === "dark" ? "다크" : "라이트"}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Layout selection */}
        <div style={SECTION}>
          <div style={SECTION_LABEL}>레이아웃</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LAYOUT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLayout(value)}
                style={{
                  ...CHIP_BASE,
                  padding: "5px 14px",
                  background: editedSpec.layout === value ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${editedSpec.layout === value ? "#f97316" : "rgba(255,255,255,0.08)"}`,
                  color: editedSpec.layout === value ? "#f97316" : "#9ca3af",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Feature tags */}
        <div style={SECTION}>
          <div style={SECTION_LABEL}>기능 목록</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {editedSpec.features.map((feature, index) => (
              <FeatureChip
                key={`${feature}-${index}`}
                label={feature}
                onRemove={() => removeFeature(index)}
              />
            ))}
            {editedSpec.features.length === 0 && (
              <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>기능 없음</span>
            )}
          </div>
          {/* Add feature input */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={newFeature}
              onChange={e => { handleInteraction(); setNewFeature(e.target.value); }}
              onKeyDown={handleFeatureKeyDown}
              placeholder="기능 추가 (Enter)"
              aria-label="새 기능 추가"
              style={{
                flex: 1,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#e8eaf0",
                fontSize: 12,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={addFeature}
              disabled={!newFeature.trim()}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: newFeature.trim() ? "#f97316" : "rgba(249,115,22,0.2)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: newFeature.trim() ? "pointer" : "not-allowed",
                opacity: newFeature.trim() ? 1 : 0.5,
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* 5. Components (read-only) */}
        <div style={{ ...SECTION, borderBottom: "none" }}>
          <div style={SECTION_LABEL}>컴포넌트 (읽기 전용)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {editedSpec.components.map(comp => (
              <span
                key={comp}
                style={{
                  padding: "3px 10px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9ca3af",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {comp}
              </span>
            ))}
            {editedSpec.components.length === 0 && (
              <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>컴포넌트 없음</span>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div style={FOOTER}>
          <button
            type="button"
            onClick={() => onConfirm(editedSpec)}
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            이대로 생성
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#9ca3af",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            건너뛰기
          </button>
        </div>

      </div>
    </div>
  );
}
