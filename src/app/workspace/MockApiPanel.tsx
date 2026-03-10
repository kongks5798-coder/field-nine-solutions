"use client";

import React from "react";
import { T } from "./workspace.constants";
import { useMockStore } from "./stores/useMockStore";
import { useUiStore } from "./stores/useUiStore";
import { ALL_MOCK_PRESETS, type MockPreset } from "./ai/mockApiInjector";

const PRESET_META: Record<MockPreset, { label: string; icon: string; desc: string }> = {
  users:    { label: "사용자",   icon: "👤", desc: "/api/users — 5명의 가짜 유저 데이터" },
  products: { label: "상품",     icon: "🛍️", desc: "/api/products — 5개 상품 (가격/이미지 포함)" },
  posts:    { label: "게시글",   icon: "📝", desc: "/api/posts — 5개 블로그 포스트" },
  weather:  { label: "날씨",     icon: "🌤️", desc: "/api/weather — 서울 7일 예보" },
  crypto:   { label: "암호화폐", icon: "₿",  desc: "/api/crypto — 5개 코인 시세" },
};

export function MockApiPanel() {
  const mockEnabled     = useMockStore(s => s.mockEnabled);
  const enabledPresets  = useMockStore(s => s.enabledPresets);
  const setMockEnabled  = useMockStore(s => s.setMockEnabled);
  const togglePreset    = useMockStore(s => s.togglePreset);
  const setShowMockPanel = useUiStore(s => s.setShowMockPanel);

  const onClose = () => setShowMockPanel(false);

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 320, maxWidth: "100%",
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
          <span style={{ fontSize: 14 }}>🎭</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>목 API</span>
          {mockEnabled && enabledPresets.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#22c55e",
              background: "rgba(34,197,94,0.15)", padding: "2px 7px", borderRadius: 8,
            }}>ON · {enabledPresets.length}개</span>
          )}
        </div>
        <button onClick={onClose} aria-label="목 API 패널 닫기"
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
        >✕</button>
      </div>

      {/* Main toggle */}
      <div style={{ padding: "14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>목 데이터 활성화</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              fetch() 요청을 가로채 가짜 데이터로 응답합니다
            </div>
          </div>
          <button
            role="switch"
            aria-checked={mockEnabled}
            onClick={() => setMockEnabled(!mockEnabled)}
            style={{
              position: "relative", width: 44, height: 24, flexShrink: 0,
              background: mockEnabled ? "#f97316" : "#374151",
              border: "none", borderRadius: 12, cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: mockEnabled ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      {/* Preset list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {!mockEnabled && (
          <div style={{ fontSize: 11, color: T.muted, textAlign: "center", padding: "16px 0", lineHeight: 1.7 }}>
            목 데이터를 활성화하면<br />아래 프리셋을 선택할 수 있습니다.
          </div>
        )}
        {mockEnabled && ALL_MOCK_PRESETS.map(preset => {
          const meta    = PRESET_META[preset];
          const checked = enabledPresets.includes(preset);
          return (
            <div
              key={preset}
              onClick={() => togglePreset(preset)}
              role="checkbox"
              aria-checked={checked}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 10px",
                borderRadius: 8, marginBottom: 6, cursor: "pointer",
                background: checked ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${checked ? "rgba(249,115,22,0.3)" : T.border}`,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!checked) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              {/* Checkbox */}
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: `2px solid ${checked ? "#f97316" : T.muted}`,
                background: checked ? "#f97316" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {checked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 3, fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: 1.5 }}>
                  {meta.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.7 }}>
          프리뷰에서 <code style={{ background: "#1e293b", padding: "1px 5px", borderRadius: 4, fontSize: 10, color: "#94a3b8" }}>fetch("/api/users")</code> 처럼 호출하세요.<br />
          실제 네트워크 요청 없이 즉시 응답합니다.
        </div>
        {mockEnabled && enabledPresets.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: "#22c55e", lineHeight: 1.6 }}>
            ✓ {enabledPresets.length}개 프리셋 활성화 — 프리뷰를 다시 실행하세요.
          </div>
        )}
      </div>
    </div>
  );
}
