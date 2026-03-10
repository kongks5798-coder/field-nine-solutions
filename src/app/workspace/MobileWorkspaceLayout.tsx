"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AiChatPanel } from "./AiChatPanel";
import { OnboardingModal } from "./OnboardingModal";
import type { FilesMap } from "./workspace.constants";
import type { AiChatPanelProps } from "./AiChatPanel";
import { useSwipe } from "@/hooks/useSwipe";
import { hapticLight } from "@/lib/haptics";

const SandpackPreviewPane = dynamic(
  () => import("./SandpackPreviewPane").then(m => ({ default: m.SandpackPreviewPane })),
  { ssr: false }
);

export interface MobileWorkspaceLayoutProps {
  // Project info
  projectName: string;

  // File state
  files: FilesMap;
  activeFile: string;
  setActiveFile: (name: string) => void;

  // Mobile tab state
  mobileTab: "chat" | "files" | "preview";
  setMobileTab: (tab: "chat" | "files" | "preview") => void;

  // Preview
  previewSrc: string;
  iframeKey: number;
  sandpackMode: boolean;
  handlePreviewError: (msg: string) => void;

  // Actions
  runProject: () => void;

  // AiChatPanel props
  aiChatProps: AiChatPanelProps;

  // Console errors
  errorCount: number;

  // AI generation state
  aiLoading: boolean;
  streamingText: string;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  setAiInput: (v: string) => void;
}

const TAB_ORDER = ["chat", "files", "preview"] as const;
type MobileTab = (typeof TAB_ORDER)[number];

export function MobileWorkspaceLayout({
  projectName,
  files,
  activeFile,
  setActiveFile,
  mobileTab,
  setMobileTab,
  previewSrc,
  iframeKey,
  sandpackMode,
  handlePreviewError,
  runProject,
  aiChatProps,
  errorCount,
  aiLoading,
  streamingText,
  showOnboarding,
  setShowOnboarding,
  setAiInput,
}: MobileWorkspaceLayoutProps) {
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const prevLoadingRef = useRef(false);

  // 생성 완료 시 자동으로 미리보기 탭으로 전환
  useEffect(() => {
    if (prevLoadingRef.current && !aiLoading) {
      setMobileTab("preview");
    }
    prevLoadingRef.current = aiLoading;
  }, [aiLoading]); // eslint-disable-line

  // First-visit swipe hint
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("swipe_hint_seen")) {
      localStorage.setItem("swipe_hint_seen", "1");
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  function goNextTab() {
    const idx = TAB_ORDER.indexOf(mobileTab);
    if (idx < TAB_ORDER.length - 1) setMobileTab(TAB_ORDER[idx + 1]);
  }

  function goPrevTab() {
    const idx = TAB_ORDER.indexOf(mobileTab);
    if (idx > 0) setMobileTab(TAB_ORDER[idx - 1]);
  }

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: goNextTab,
    onSwipeRight: goPrevTab,
  });

  function handleTabClick(tab: MobileTab) {
    hapticLight();
    setMobileTab(tab);
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0d1117", color: "#fff" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile header */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#161b22", borderBottom: "1px solid #30363d", gap: 12, flexShrink: 0 }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 20 }}>🔙</a>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName}</span>
        <button
          onClick={runProject}
          style={{ background: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
        >▶ 실행</button>
      </div>

      {/* AI 생성 중 프로그레스 바 */}
      {aiLoading && (
        <div style={{ background: "#0d1117", borderBottom: "1px solid #30363d", padding: "6px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#f97316", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {streamingText || "⚡ 생성 중..."}
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg, #f97316, #fb923c)",
              animation: "mobileProgressAnim 1.5s ease-in-out infinite",
              width: "40%",
            }} />
          </div>
          <style>{`@keyframes mobileProgressAnim { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {mobileTab === "files" ? (
          <div style={{ height: "100%", overflowY: "auto", padding: "12px 0", background: "#0d1117" }}>
            {Object.keys(files).length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#6b7280", fontSize: 13 }}>파일이 없습니다</div>
            ) : Object.keys(files).map(name => (
              <button
                key={name}
                onClick={() => { setActiveFile(name); setMobileTab("chat"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px", background: activeFile === name ? "rgba(249,115,22,0.08)" : "transparent",
                  border: "none", borderLeft: activeFile === name ? "2px solid #f97316" : "2px solid transparent",
                  color: activeFile === name ? "#f97316" : "#c9d1d9", fontSize: 13, cursor: "pointer",
                  textAlign: "left", fontFamily: "monospace",
                }}
              >
                <span style={{ fontSize: 16 }}>{name.endsWith(".html") ? "🌐" : name.endsWith(".css") ? "🎨" : name.endsWith(".js") ? "⚡" : "📄"}</span>
                {name}
              </button>
            ))}
          </div>
        ) : mobileTab === "chat" ? (
          <AiChatPanel {...aiChatProps} />
        ) : (
          sandpackMode ? (
            <SandpackPreviewPane
              files={files}
              theme="dark"
              onError={handlePreviewError}
            />
          ) : (
            <iframe
              key={iframeKey}
              srcDoc={previewSrc || '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#999;background:#f5f5f5;flex-direction:column;gap:12px"><svg width="48" height="48" fill="none" stroke="#ddd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg><p style="margin:0;font-size:14px">AI에게 무엇을 만들지 알려주세요</p></body></html>'}
              style={{ width: "100%", height: "100%", border: "none" }}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
              referrerPolicy="no-referrer"
            />
          )
        )}

        {/* First-visit swipe hint */}
        {showSwipeHint && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 13,
              borderRadius: 20,
              padding: "6px 16px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            ← 스와이프로 탭 전환
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderTop: "1px solid #30363d", background: "#161b22", flexShrink: 0 }}>
        {TAB_ORDER.map(tab => {
          const isActive = mobileTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                flex: 1,
                minHeight: 44,
                padding: "8px 4px 6px",
                border: "none",
                borderTop: isActive ? "2px solid #f97316" : "2px solid transparent",
                background: "transparent",
                color: isActive ? "#f97316" : "#8b949e",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: isActive ? 600 : 400,
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {tab === "chat" ? "💬 AI" : tab === "files" ? "📁 파일" : (
                <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  👁 미리보기
                  {errorCount > 0 && (
                    <span style={{
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 99,
                      minWidth: 16,
                      height: 16,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}>{errorCount > 9 ? "9+" : errorCount}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Onboarding modal for mobile */}
      <OnboardingModal
        open={showOnboarding}
        onStart={() => {
          localStorage.setItem("fn_onboarded", "1");
          setShowOnboarding(false);
          setAiInput("간단한 할 일 관리 앱을 만들어줘");
        }}
        onSkip={() => { localStorage.setItem("fn_onboarded", "1"); setShowOnboarding(false); }}
      />
    </div>
  );
}
