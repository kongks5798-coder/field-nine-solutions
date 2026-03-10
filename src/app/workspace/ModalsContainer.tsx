"use client";

import dynamic from "next/dynamic";
import { type RefObject, type MutableRefObject } from "react";
import { WorkspaceToast } from "./WorkspaceToast";
import { CommandPalette } from "./CommandPalette";
import { StatusBar } from "./StatusBar";
import { OnboardingModal } from "./OnboardingModal";
import { OnboardingWelcomeModal } from "./OnboardingWelcomeModal";
import InstallBanner from "@/components/InstallBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getTheme, AI_MODELS } from "./workspace.constants";
import type { FilesMap, HistoryEntry, LogEntry, AiMsg, LeftTab } from "./workspace.constants";
import { getTemplateList, applyTemplateByName } from "./workspace.templates";
import { track } from "@/lib/analytics";
import type { AbVersion } from "./ai/abTest";

const TopUpModal = dynamic(() => import("./TopUpModal").then(m => ({ default: m.TopUpModal })), { ssr: false });
const CdnModal = dynamic(() => import("./CdnModal").then(m => ({ default: m.CdnModal })), { ssr: false });
const PublishModal = dynamic(() => import("./PublishModal").then(m => ({ default: m.PublishModal })), { ssr: false });
const AbTestModal = dynamic(() => import("./AbTestModal").then(m => ({ default: m.AbTestModal })), { ssr: false });
const KeyboardShortcutsModal = dynamic(() => import("./KeyboardShortcutsModal").then(m => ({ default: m.KeyboardShortcutsModal })), { ssr: false });
const VersionHistoryPanel = dynamic(() => import("./VersionHistoryPanel"), { ssr: false });
const CloudVersionSidePanel = dynamic(() => import("./VersionHistoryPanel").then(m => ({ default: m.CloudVersionSidePanel })), { ssr: false });
const EnvPanel = dynamic(() => import("./EnvPanel").then(m => ({ default: m.EnvPanel })), { ssr: false });
const AgentTeamPanel = dynamic(() => import("./AgentTeamPanel").then(m => ({ default: m.AgentTeamPanel })), { ssr: false });
const ModelComparePanel = dynamic(() => import("./ModelComparePanel").then(m => ({ default: m.ModelComparePanel })), { ssr: false });
const CollabPanel = dynamic(() => import("./CollabPanel").then(m => ({ default: m.CollabPanel })), { ssr: false });
const DeployPanel = dynamic(() => import("./DeployPanel").then(m => ({ default: m.DeployPanel })), { ssr: false });
const GitHubPanel = dynamic(() => import("./GitHubPanel").then(m => ({ default: m.GitHubPanel })), { ssr: false });
const DatabasePanel = dynamic(() => import("./DatabasePanel").then(m => ({ default: m.DatabasePanel })), { ssr: false });
const PerformancePanel = dynamic(() => import("./PerformancePanel").then(m => ({ default: m.PerformancePanel })), { ssr: false });
const SecretsVaultPanel = dynamic(() => import("./SecretsVaultPanel").then(m => ({ default: m.SecretsVaultPanel })), { ssr: false });
const TemplateMarketplacePanel = dynamic(() => import("./TemplateMarketplacePanel").then(m => ({ default: m.TemplateMarketplacePanel })), { ssr: false });
const PluginManagerPanel = dynamic(() => import("./PluginManagerPanel").then(m => ({ default: m.PluginManagerPanel })), { ssr: false });
const TeamManagementPanel = dynamic(() => import("./TeamManagementPanel").then(m => ({ default: m.TeamManagementPanel })), { ssr: false });
const VisualBuilderPanel = dynamic(() => import("./VisualBuilderPanel").then(m => ({ default: m.VisualBuilderPanel })), { ssr: false });
const GitGraphPanel = dynamic(() => import("./GitGraphPanel").then(m => ({ default: m.GitGraphPanel })), { ssr: false });

export interface ModalsContainerProps {
  // ── Theme ───────────────────────────────────────────────────────────────────
  themeMode: "light" | "dark";

  // ── Layout / Mobile ─────────────────────────────────────────────────────────
  isMobile: boolean;

  // ── Router ───────────────────────────────────────────────────────────────────
  router: { push: (url: string) => void };

  // ── StatusBar ────────────────────────────────────────────────────────────────
  setShowConsole: (v: boolean) => void;
  setLeftTab: (tab: LeftTab) => void;

  // ── CommandPalette ───────────────────────────────────────────────────────────
  runProject: () => void;
  publishProject: () => Promise<void>;
  toggleTeamPanel: () => Promise<void>;
  toggleSplit: () => void;
  setShowCompare: (v: boolean) => void;
  showCollabPanel: boolean;
  setShowCollabPanel: (v: boolean) => void;

  // ── Collab ───────────────────────────────────────────────────────────────────
  showToast: (msg: string) => void;

  // ── Tier-2 Panels ────────────────────────────────────────────────────────────
  showGitHubPanel: boolean;
  setShowGitHubPanel: (v: boolean) => void;
  showDatabasePanel: boolean;
  setShowDatabasePanel: (v: boolean) => void;
  showPerformancePanel: boolean;
  setShowPerformancePanel: (v: boolean) => void;
  showSecretsPanel: boolean;
  setShowSecretsPanel: (v: boolean) => void;
  showTemplatesPanel: boolean;
  setShowTemplatesPanel: (v: boolean) => void;
  showPluginManager: boolean;
  setShowPluginManager: (v: boolean) => void;
  showTeamManagement: boolean;
  setShowTeamManagement: (v: boolean) => void;
  showVisualBuilder: boolean;
  setShowVisualBuilder: (v: boolean) => void;
  showGitGraph: boolean;
  setShowGitGraph: (v: boolean) => void;

  // ── Keyboard Shortcuts ───────────────────────────────────────────────────────
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;

  // ── CDN Modal ─────────────────────────────────────────────────────────────────
  showCdnModal: boolean;
  setShowCdnModal: (v: boolean) => void;
  cdnUrls: string[];
  setCdnUrls: (urls: string[] | ((prev: string[]) => string[])) => void;
  customCdn: string;
  setCustomCdn: (v: string) => void;

  // ── Env Panel ─────────────────────────────────────────────────────────────────
  showEnvPanel: boolean;

  // ── AI Debugger Banner ────────────────────────────────────────────────────────
  previewError: string | null;
  setPreviewError: (v: string | null) => void;
  setAiInput: (v: string) => void;
  handleAiSend: () => void;

  // ── Agent Team Panel ──────────────────────────────────────────────────────────
  activateTeam: (prompt: string) => void;
  reshuffleTeam: () => Promise<void>;

  // ── Welcome / Onboarding ──────────────────────────────────────────────────────
  showWelcome: boolean;
  setShowWelcome: (v: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;

  // ── Upgrade Modal ─────────────────────────────────────────────────────────────
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  aiMode: string;

  // ── Publish Modal ─────────────────────────────────────────────────────────────
  showPublishModal: boolean;
  setShowPublishModal: (v: boolean) => void;
  publishedUrl: string;
  tokenBalance: number;
  files: FilesMap;

  // ── Template Gallery ──────────────────────────────────────────────────────────
  showTemplates: boolean;
  setShowTemplates: (v: boolean) => void;
  filesRef: RefObject<FilesMap>;
  setFiles: (files: FilesMap) => void;
  setChangedFiles: (files: string[]) => void;
  setOpenTabs: (fn: (prev: string[]) => string[]) => void;
  setActiveFile: (file: string) => void;
  pushHistory: (label: string) => void;
  templateAppliedAt: MutableRefObject<number>;
  autoFixAttempts: MutableRefObject<number>;
  setPreviewSrc: (src: string) => void;
  setIframeKey: (key: number) => void;
  setHasRun: (v: boolean) => void;
  setLogs: (logs: LogEntry[]) => void;
  setErrorCount: (n: number) => void;
  cdnRef: MutableRefObject<string[]>;
  envRef: MutableRefObject<Record<string, string>>;
  injectCdns: (html: string, urls: string[]) => string;
  injectEnvVars: (html: string, env: Record<string, string>) => string;
  injectSupabaseCdn: (html: string, env: Record<string, string>) => string;
  buildPreview: (files: FilesMap) => string;
  injectConsoleCapture: (html: string) => string;
  nowTs: () => string;
  setAiMsgs: (fn: AiMsg[] | ((prev: AiMsg[]) => AiMsg[])) => void;
  aiMsgs: AiMsg[];

  // ── Context Menu ──────────────────────────────────────────────────────────────
  ctxMenu: { x: number; y: number; file: string } | null;
  ctxMenuRef: RefObject<HTMLDivElement>;
  setCtxMenu: (v: { x: number; y: number; file: string } | null) => void;
  openFile: (file: string) => void;
  deleteFile: (file: string) => void;

  // ── Version History ───────────────────────────────────────────────────────────
  showVersionHistory: boolean;
  history: HistoryEntry[];
  setShowVersionHistory: (v: boolean) => void;

  // ── Remote Version History ────────────────────────────────────────────────────
  showRemoteVersions: boolean;
  setShowRemoteVersions: (v: boolean) => void;
  projectId: string | null;

  // ── A/B Test ─────────────────────────────────────────────────────────────────
  showAbTest: boolean;
  setShowAbTest: (v: boolean) => void;
  aiInput: string;
  abVersionA: AbVersion;
  abVersionB: AbVersion;
  handleAbTestSelect: (winner: "A" | "B") => void;

  // ── Model Compare ─────────────────────────────────────────────────────────────
  showCompare: boolean;
  comparePrompt: string;
  handleCompareApply: (text: string) => void;

  // ── Toast ─────────────────────────────────────────────────────────────────────
  toast: string | null;

  // ── TopUp Modal ───────────────────────────────────────────────────────────────
  showTopUp: boolean;
  topUpData: { currentSpent: number; hardLimit: number; periodReset: string } | null;
  setShowTopUp: (v: boolean) => void;
}

export function ModalsContainer(props: ModalsContainerProps) {
  const {
    themeMode, isMobile, router,
    setShowConsole, setLeftTab,
    runProject, publishProject, toggleTeamPanel, toggleSplit,
    setShowCompare, setShowVersionHistory,
    showCollabPanel, setShowCollabPanel,
    showToast,
    showGitHubPanel, setShowGitHubPanel,
    showDatabasePanel, setShowDatabasePanel,
    showPerformancePanel, setShowPerformancePanel,
    showSecretsPanel, setShowSecretsPanel,
    showTemplatesPanel, setShowTemplatesPanel,
    showPluginManager, setShowPluginManager,
    showTeamManagement, setShowTeamManagement,
    showVisualBuilder, setShowVisualBuilder,
    showGitGraph, setShowGitGraph,
    showShortcuts, setShowShortcuts,
    showCdnModal, setShowCdnModal, cdnUrls, setCdnUrls, customCdn, setCustomCdn,
    showEnvPanel,
    previewError, setPreviewError, setAiInput, handleAiSend,
    activateTeam, reshuffleTeam,
    showWelcome, setShowWelcome,
    showOnboarding, setShowOnboarding,
    showUpgradeModal, setShowUpgradeModal, aiMode,
    showPublishModal, setShowPublishModal, publishedUrl, tokenBalance, files,
    showTemplates, setShowTemplates,
    filesRef, setFiles, setChangedFiles, setOpenTabs, setActiveFile, pushHistory,
    templateAppliedAt, autoFixAttempts,
    setPreviewSrc, setIframeKey, setHasRun, setLogs, setErrorCount,
    cdnRef, envRef,
    injectCdns, injectEnvVars, injectSupabaseCdn, buildPreview, injectConsoleCapture, nowTs,
    setAiMsgs, aiMsgs,
    ctxMenu, ctxMenuRef, setCtxMenu, openFile, deleteFile,
    showVersionHistory, history,
    showRemoteVersions, setShowRemoteVersions, projectId,
    showAbTest, setShowAbTest, aiInput, abVersionA, abVersionB, handleAbTestSelect,
    showCompare, comparePrompt, handleCompareApply,
    toast,
    showTopUp, topUpData, setShowTopUp,
  } = props;

  const theme = getTheme(themeMode);

  return (
    <>
      {/* ══ STATUS BAR ═════════════════════════════════════════════════════════ */}
      {!isMobile && (
        <StatusBar
          onClickErrors={() => { setShowConsole(true); setLeftTab("ai"); }}
        />
      )}

      {/* ══ COMMAND PALETTE ════════════════════════════════════════════════════ */}
      <CommandPalette
        runProject={runProject}
        publishProject={publishProject}
        router={router}
        onFormat={() => {/* format via editor */}}
        onCompare={() => setShowCompare(true)}
        onTeam={() => { toggleTeamPanel(); }}
        onHistory={() => setShowVersionHistory(true)}
        onSplit={() => toggleSplit()}
        onStartCollab={() => setShowCollabPanel(true)}
        onStopCollab={() => setShowCollabPanel(false)}
      />

      {/* ══ COLLABORATION PANEL ═══════════════════════════════════════════════ */}
      {showCollabPanel && (
        <ErrorBoundary><CollabPanel onShowToast={showToast} /></ErrorBoundary>
      )}

      {/* ══ TIER-2 PANELS (wrapped in ErrorBoundary) ══════════════════════ */}
      {showGitHubPanel && <ErrorBoundary><GitHubPanel onClose={() => setShowGitHubPanel(false)} /></ErrorBoundary>}
      {showDatabasePanel && <ErrorBoundary><DatabasePanel onClose={() => setShowDatabasePanel(false)} /></ErrorBoundary>}
      {showPerformancePanel && <ErrorBoundary><PerformancePanel onClose={() => setShowPerformancePanel(false)} /></ErrorBoundary>}
      {showSecretsPanel && <ErrorBoundary><SecretsVaultPanel onClose={() => setShowSecretsPanel(false)} /></ErrorBoundary>}
      {showTemplatesPanel && <ErrorBoundary><TemplateMarketplacePanel onClose={() => setShowTemplatesPanel(false)} /></ErrorBoundary>}
      {showPluginManager && <ErrorBoundary><PluginManagerPanel onClose={() => setShowPluginManager(false)} /></ErrorBoundary>}
      {showTeamManagement && <ErrorBoundary><TeamManagementPanel onClose={() => setShowTeamManagement(false)} /></ErrorBoundary>}
      {showVisualBuilder && <ErrorBoundary><VisualBuilderPanel onClose={() => setShowVisualBuilder(false)} /></ErrorBoundary>}
      {showGitGraph && <ErrorBoundary><GitGraphPanel onClose={() => setShowGitGraph(false)} /></ErrorBoundary>}

      {/* ══ KEYBOARD SHORTCUTS MODAL ═════════════════════════════════════════ */}
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* ══ CDN MODAL ══════════════════════════════════════════════════════════ */}
      <CdnModal
        open={showCdnModal}
        onClose={() => setShowCdnModal(false)}
        cdnUrls={cdnUrls}
        setCdnUrls={setCdnUrls}
        customCdn={customCdn}
        setCustomCdn={setCustomCdn}
        showToast={showToast}
        onApply={() => { setShowCdnModal(false); runProject(); showToast(`📦 ${cdnUrls.length}개 패키지 적용`); }}
      />

      {/* ══ ENV PANEL ════════════════════════════════════════════════════════════ */}
      {showEnvPanel && (
        <ErrorBoundary><EnvPanel /></ErrorBoundary>
      )}

      {/* ══ DEPLOY PANEL ═══════════════════════════════════════════════════════ */}
      <ErrorBoundary><DeployPanel /></ErrorBoundary>

      {/* ══ AI 디버거 배너 ════════════════════════════════════════════════════════ */}
      {previewError && (
        <div style={{
          position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)",
          zIndex: 9998, background: "#1a0a0a", border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center",
          gap: 10, boxShadow: "0 4px 20px rgba(239,68,68,0.2)", maxWidth: 480,
        }}>
          <span style={{ fontSize: 16 }}>🐛</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 2 }}>에러 감지됨</div>
            <div style={{ fontSize: 10, color: "rgba(248,113,113,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewError}</div>
          </div>
          <button
            onClick={() => {
              setAiInput(`다음 에러를 수정해줘:\n\n${previewError}`);
              setPreviewError(null);
              setTimeout(() => handleAiSend(), 100);
            }}
            style={{
              padding: "5px 10px", borderRadius: 7, border: "none",
              background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff",
              fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >AI 수정</button>
          <button onClick={() => setPreviewError(null)} style={{ background: "none", border: "none", color: "rgba(248,113,113,0.5)", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
        </div>
      )}

      {/* ══ AGENT TEAM PANEL ═══════════════════════════════════════════════════ */}
      <AgentTeamPanel
        onActivate={activateTeam}
        onReshuffle={reshuffleTeam}
      />

      {/* ══ 웰컴 온보딩 모달 (신규 가입자) ══════════════════════════════════════ */}
      {showWelcome && (
        <OnboardingWelcomeModal
          onClose={() => {
            localStorage.setItem("dalkak_onboarded", "1");
            setShowWelcome(false);
          }}
          onSelectExample={(prompt) => {
            localStorage.setItem("dalkak_onboarded", "1");
            setShowWelcome(false);
            setAiInput(prompt);
            setTimeout(() => handleAiSend(), 300);
          }}
        />
      )}

      {/* ══ 온보딩 모달 ══════════════════════════════════════════════════════════ */}
      <OnboardingModal
        open={showOnboarding}
        onStart={() => {
          localStorage.setItem("fn_onboarded", "1");
          setShowOnboarding(false);
          setAiInput("간단한 할 일 관리 앱을 만들어줘");
        }}
        onSkip={() => { localStorage.setItem("fn_onboarded", "1"); setShowOnboarding(false); }}
        onSelectTemplate={(prompt) => {
          localStorage.setItem("fn_onboarded", "1");
          setShowOnboarding(false);
          setAiInput(prompt);
          setTimeout(() => handleAiSend(), 300);
        }}
      />

      {/* ── Upgrade Modal ──────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
          onClick={() => setShowUpgradeModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title" onClick={e => e.stopPropagation()}
            style={{ background: theme.surface, border: `1px solid ${theme.borderHi}`, borderRadius: 24, padding: "36px 32px", width: 520, maxWidth: "90vw", boxShadow: "0 40px 100px rgba(0,0,0,0.12)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
              <h2 id="upgrade-modal-title" style={{ fontSize: 20, fontWeight: 900, color: theme.text, margin: "0 0 8px" }}>AI 한도에 도달했습니다</h2>
              <p style={{ color: theme.muted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                업그레이드하면 더 많은 AI 요청과 고급 기능을 사용할 수 있습니다.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { name: "프로", price: "₩39,000", desc: "무제한", color: theme.accent, popular: true },
                { name: "팀", price: "₩99,000", desc: "무제한 + 전담 지원", color: theme.accent, popular: false },
              ].map(plan => (
                <div key={plan.name}
                  style={{ background: plan.popular ? `${theme.accent}15` : "rgba(255,255,255,0.05)", border: `2px solid ${plan.popular ? theme.borderHi : theme.border}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}>
                  {plan.popular && <div style={{ fontSize: 10, fontWeight: 700, color: theme.accent, marginBottom: 8, letterSpacing: "0.05em" }}>✦ 가장 인기</div>}
                  <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 11, color: theme.muted }}> / 월</span></div>
                  <div style={{ fontSize: 11, color: theme.muted }}>AI {plan.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: theme.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: theme.text }}>지금 다른 모델로 전환해볼 수도 있어요:</strong> 상단의 모델 선택에서
              {aiMode === "openai" ? " Anthropic 또는 Gemini" : aiMode === "anthropic" ? " OpenAI 또는 Gemini" : " OpenAI 또는 Anthropic"} 선택
            </div>
            <button onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}
              style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentB})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              플랜 업그레이드 →
            </button>
            <button onClick={() => setShowUpgradeModal(false)}
              style={{ width: "100%", padding: "10px", background: "transparent", color: theme.muted, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              나중에 하기
            </button>
          </div>
        </div>
      )}

      <PublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        publishedUrl={publishedUrl}
        tokenBalance={tokenBalance}
        showToast={showToast}
        htmlContent={files["index.html"]?.content}
        onAiImprove={(prompt) => {
          setAiInput(prompt);
          setTimeout(() => handleAiSend(), 100);
        }}
      />

      {/* ══ TEMPLATE GALLERY MODAL ═══════════════════════════════════════════ */}
      {showTemplates && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
          onClick={() => setShowTemplates(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="tpl-gallery-title" onClick={e => e.stopPropagation()}
            style={{ background: theme.surface, border: `1px solid ${theme.borderHi}`, borderRadius: 20, padding: "28px 24px", width: 640, maxWidth: "92vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 id="tpl-gallery-title" style={{ fontSize: 18, fontWeight: 900, color: theme.text, margin: 0 }}>📦 템플릿 갤러리</h2>
                <p style={{ fontSize: 11, color: theme.muted, margin: "4px 0 0" }}>클릭 한 번으로 즉시 생성 — AI 호출 없이 0ms</p>
              </div>
              <button onClick={() => setShowTemplates(false)}
                style={{ background: "none", border: "none", color: theme.muted, fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
              {getTemplateList().map(tpl => (
                <button key={tpl.name}
                  onClick={() => {
                    const result = applyTemplateByName(tpl.name);
                    if (result) {
                      track("template_selected", { templateName: tpl.name ?? "unknown" });
                      const updated = { ...filesRef.current, ...result };
                      setFiles(updated);
                      setChangedFiles(Object.keys(result));
                      setTimeout(() => setChangedFiles([]), 3000);
                      setOpenTabs(p => { const next = [...p]; for (const f of Object.keys(result)) if (!next.includes(f)) next.push(f); return next; });
                      setActiveFile("index.html");
                      pushHistory("템플릿 적용 전");
                      templateAppliedAt.current = Date.now();
                      autoFixAttempts.current = 0;
                      setTimeout(() => {
                        let html = buildPreview(updated);
                        if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
                        html = injectEnvVars(html, envRef.current);
                        html = injectSupabaseCdn(html, envRef.current);
                        setPreviewSrc(injectConsoleCapture(html));
                        setIframeKey(Date.now());
                        setHasRun(true); setLogs([]); setErrorCount(0);
                      }, 50);
                      setAiMsgs(p => [...p, {
                        role: "agent",
                        text: `${tpl.icon} ${tpl.name} 템플릿을 적용했습니다!\n\n${tpl.description}\n\n▶ 실행 버튼을 누르거나 미리보기를 확인하세요.`,
                        ts: nowTs(),
                      }]);
                      showToast(`${tpl.icon} ${tpl.name} 적용 완료!`);
                    }
                    setShowTemplates(false);
                  }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "18px 12px", borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${theme.border}`,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.borderHi; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "none"; }}
                >
                  <span style={{ fontSize: 32 }}>{tpl.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{tpl.name}</span>
                  <span style={{ fontSize: 10, color: theme.muted, lineHeight: 1.5, textAlign: "center" }}>{tpl.description}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>{tpl.category}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 11, color: theme.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: theme.text }}>팁:</strong> AI에게 &ldquo;테트리스 만들어줘&rdquo; 또는 &ldquo;계산기 만들어줘&rdquo;라고 말해도 자동으로 템플릿이 적용됩니다.
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div ref={ctxMenuRef} role="menu" aria-label="파일 컨텍스트 메뉴" onClick={e => e.stopPropagation()}
          style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 9, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden", minWidth: 140 }}>
          {[
            { label: "파일 열기", action: () => { openFile(ctxMenu.file); setCtxMenu(null); } },
            { label: "삭제", action: () => deleteFile(ctxMenu.file), danger: true },
          ].map(item => (
            <button key={item.label} role="menuitem" onClick={item.action}
              style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", color: (item as { danger?: boolean }).danger ? theme.red : theme.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >{item.label}</button>
          ))}
        </div>
      )}

      {/* Version History Panel */}
      {showVersionHistory && (
        <ErrorBoundary>
          <VersionHistoryPanel
            history={history}
            currentFiles={files}
            onRestore={(restored) => {
              pushHistory("복원 전");
              setFiles(restored);
              showToast("\uD83D\uDCDC 복원 완료");
              setShowVersionHistory(false);
            }}
            onClose={() => setShowVersionHistory(false)}
          />
        </ErrorBoundary>
      )}

      {/* Remote (Cloud) Version History — Slide-in Side Panel */}
      {showRemoteVersions && projectId && (
        <ErrorBoundary>
          <CloudVersionSidePanel
            projectId={projectId}
            onRestore={(restored) => {
              pushHistory("버전 복원 전");
              setFiles(restored);
              showToast("\u2601\uFE0F 클라우드 버전 복원 완료");
              setShowRemoteVersions(false);
            }}
            onClose={() => setShowRemoteVersions(false)}
          />
        </ErrorBoundary>
      )}

      {/* A/B Test Modal */}
      {showAbTest && (
        <ErrorBoundary>
          <AbTestModal
            prompt={aiInput}
            versionA={abVersionA}
            versionB={abVersionB}
            onSelect={handleAbTestSelect}
            onClose={() => setShowAbTest(false)}
          />
        </ErrorBoundary>
      )}

      {/* Model Compare Panel */}
      {showCompare && (
        <ErrorBoundary>
          <ModelComparePanel
            prompt={comparePrompt}
            models={AI_MODELS.map(m => ({ id: m.id, label: m.label, provider: m.provider }))}
            onApply={handleCompareApply}
            onClose={() => setShowCompare(false)}
          />
        </ErrorBoundary>
      )}

      {/* Toast */}
      <WorkspaceToast message={toast || null} />
      {showTopUp && topUpData && (
        <TopUpModal
          currentSpent={topUpData.currentSpent}
          hardLimit={topUpData.hardLimit}
          periodReset={topUpData.periodReset}
          onClose={() => setShowTopUp(false)}
        />
      )}

      {/* PWA Install Banner (mobile only) */}
      {isMobile && <InstallBanner />}
    </>
  );
}
