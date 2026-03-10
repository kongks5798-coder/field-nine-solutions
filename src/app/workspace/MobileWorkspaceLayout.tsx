"use client";

import dynamic from "next/dynamic";
import { AiChatPanel } from "./AiChatPanel";
import { OnboardingModal } from "./OnboardingModal";
import type { FilesMap } from "./workspace.constants";
import type { AiChatPanelProps } from "./AiChatPanel";

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

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  setAiInput: (v: string) => void;
}

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
  showOnboarding,
  setShowOnboarding,
  setAiInput,
}: MobileWorkspaceLayoutProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0d1117", color: "#fff" }}>
      {/* Mobile header */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#161b22", borderBottom: "1px solid #30363d", gap: 12, flexShrink: 0 }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 20 }}>🔙</a>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{projectName}</span>
        <button
          onClick={runProject}
          style={{ background: "#238636", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}
        >▶ 실행</button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #30363d", background: "#161b22", flexShrink: 0 }}>
        {(["chat", "files", "preview"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            style={{
              flex: 1, padding: "10px", border: "none", background: "transparent",
              color: mobileTab === tab ? "#f97316" : "#8b949e",
              borderBottom: mobileTab === tab ? "2px solid #f97316" : "2px solid transparent",
              fontSize: 13, cursor: "pointer", fontWeight: mobileTab === tab ? 600 : 400,
              fontFamily: "inherit",
            }}
          >
            {tab === "chat" ? "💬 AI" : tab === "files" ? "📁 파일" : "👁 미리보기"}
          </button>
        ))}
      </div>

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
