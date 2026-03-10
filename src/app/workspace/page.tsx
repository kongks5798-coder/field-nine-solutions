"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  T, DEFAULT_FILES,
  extToLang,
  buildPreview, injectConsoleCapture, injectCdns, injectEnvVars, injectSupabaseCdn,
  parseAiFiles, nowTs, isFileTruncated,
  getTokens, setTokenStore, calcCost, tokToUSD,
  compressHtml, PROJ_KEY, CUR_KEY,
  AI_MODELS,
} from "./workspace.constants";
import type {
  FilesMap, LeftTab,
  LogLevel, LogEntry, Project,
} from "./workspace.constants";
import { matchTemplate, getTemplateList, applyTemplateByName } from "./workspace.templates";
import { parseAiResponse } from "./ai/diffParser";
import { applyDiffPatch } from "./ai/diffApplicator";
import { buildSystemPrompt, detectPlatformType } from "./ai/systemPromptBuilder";
import { detectCommercialRequest, detectQualityUpgrade, buildForcedPipeline, buildStepPrompt, getStepLabel, detectHighComplexity } from "./ai/commercialPipeline";
import type { PipelineConfig } from "./ai/commercialPipeline";
import {
  buildArchitectPrompt, parseArchitectResponse,
  buildHtmlPrompt, buildCssPrompt, buildJsPrompt,
  getTeamPipelineLabel,
  type ArchitectSpec,
} from "./ai/teamPipeline";
import { runParallelBuilders, runSingleStream, type BuilderRequest } from "./ai/streamTeam";
import { runCriticAnalysis, runPatcherFix, shouldRunCritic } from "./ai/criticAgent";
import { validateCommercialQuality, buildQualityFixPrompt } from "./ai/qualityValidator";
import { REFINEMENT_PHASES, getPhasesToRun } from "./ai/refinementPipeline";
import type { RefinementContext } from "./ai/refinementPipeline";
import { buildSelfEvalPrompt, parseSelfEvaluation, buildImprovementPrompt, shouldContinueRefining } from "./ai/autoRefineLoop";
import { buildAnalysisPrompt, parseAnalysisResponse, buildAutoFixPrompt, getAutoApplySuggestions, getAutoImproveLabel } from "./ai/autoImproveAgent";
import { trimHistory, createBudget, estimateTokens, buildFileContext } from "./ai/contextManager";
import { getModelMeta, getBestModelForTask } from "./ai/modelRegistry";
import { canModelHandleVision } from "./ai/visionGuard";
import { buildTeamPrompt } from "./ai/agentPromptBuilder";
import { WorkspaceToast } from "./WorkspaceToast";
const TopUpModal = dynamic(() => import("./TopUpModal").then(m => ({ default: m.TopUpModal })), { ssr: false });
import { DragHandle } from "./DragHandle";
const CdnModal = dynamic(() => import("./CdnModal").then(m => ({ default: m.CdnModal })), { ssr: false });
import { OnboardingModal } from "./OnboardingModal";
const PublishModal = dynamic(() => import("./PublishModal").then(m => ({ default: m.PublishModal })), { ssr: false });
import { AiChatPanel } from "./AiChatPanel";
const AbTestModal = dynamic(() => import("./AbTestModal").then(m => ({ default: m.AbTestModal })), { ssr: false });
import { PreviewHeaderToolbar } from "./PreviewHeaderToolbar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { WorkspaceFileTree } from "./WorkspaceFileTree";
import { WorkspaceEditorPane } from "./WorkspaceEditorPane";
import { ActivityBar } from "./ActivityBar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { ExplainPanel } from "./ExplainPanel";
import HistoryPanel from "./HistoryPanel";
import { WorkspaceShell } from "./WorkspaceShell";
import { AutoFixBanner } from "./AutoFixBanner";
import { useSwipe } from "@/hooks/useSwipe";
import { track } from "@/lib/analytics";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { hapticLight } from "@/utils/haptics";
import { getChangedLineCount } from "@/utils/diffUtils";
import InstallBanner from "@/components/InstallBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
const KeyboardShortcutsModal = dynamic(() => import("./KeyboardShortcutsModal").then(m => ({ default: m.KeyboardShortcutsModal })), { ssr: false });
const FileSearchPanel = dynamic(() => import("./FileSearchPanel").then(m => ({ default: m.FileSearchPanel })), { ssr: false });
const VersionHistoryPanel = dynamic(() => import("./VersionHistoryPanel"), { ssr: false });
const RemoteVersionHistoryPanel = dynamic(() => import("./VersionHistoryPanel").then(m => ({ default: m.RemoteVersionHistoryPanel })), { ssr: false });
const EnvPanel = dynamic(() => import("./EnvPanel").then(m => ({ default: m.EnvPanel })), { ssr: false });
const AgentTeamPanel = dynamic(() => import("./AgentTeamPanel").then(m => ({ default: m.AgentTeamPanel })), { ssr: false });
const ModelComparePanel = dynamic(() => import("./ModelComparePanel").then(m => ({ default: m.ModelComparePanel })), { ssr: false });
const CollabPanel = dynamic(() => import("./CollabPanel").then(m => ({ default: m.CollabPanel })), { ssr: false });
const GitPanel = dynamic(() => import("./GitPanel").then(m => ({ default: m.GitPanel })), { ssr: false });
const PackagePanel = dynamic(() => import("./PackagePanel").then(m => ({ default: m.PackagePanel })), { ssr: false });
const DeployPanel = dynamic(() => import("./DeployPanel").then(m => ({ default: m.DeployPanel })), { ssr: false });
const AutonomousPanel = dynamic(() => import("./AutonomousPanel").then(m => ({ default: m.AutonomousPanel })), { ssr: false });
const GitHubPanel = dynamic(() => import("./GitHubPanel").then(m => ({ default: m.GitHubPanel })), { ssr: false });
const DatabasePanel = dynamic(() => import("./DatabasePanel").then(m => ({ default: m.DatabasePanel })), { ssr: false });
const PerformancePanel = dynamic(() => import("./PerformancePanel").then(m => ({ default: m.PerformancePanel })), { ssr: false });
const SecretsVaultPanel = dynamic(() => import("./SecretsVaultPanel").then(m => ({ default: m.SecretsVaultPanel })), { ssr: false });
const TemplateMarketplacePanel = dynamic(() => import("./TemplateMarketplacePanel").then(m => ({ default: m.TemplateMarketplacePanel })), { ssr: false });
const PluginManagerPanel = dynamic(() => import("./PluginManagerPanel").then(m => ({ default: m.PluginManagerPanel })), { ssr: false });
const TeamManagementPanel = dynamic(() => import("./TeamManagementPanel").then(m => ({ default: m.TeamManagementPanel })), { ssr: false });
const VisualBuilderPanel = dynamic(() => import("./VisualBuilderPanel").then(m => ({ default: m.VisualBuilderPanel })), { ssr: false });
const GitGraphPanel = dynamic(() => import("./GitGraphPanel").then(m => ({ default: m.GitGraphPanel })), { ssr: false });
const SandpackPreviewPane = dynamic(
  () => import("./SandpackPreviewPane").then(m => ({ default: m.SandpackPreviewPane })),
  { ssr: false }
);
import {
  useFileSystemStore,
  useProjectStore, loadProjects, saveProjectToStorage, genId,
  useAiStore,
  useLayoutStore,
  usePreviewStore,
  useEditorStore,
  useUiStore,
  useTokenStore,
  useParameterStore,
  useEnvStore,
  useCollabStore,
  useDeployStore,
} from "./stores";

// ── AI System Prompt (now in ./ai/systemPromptBuilder.ts) ───────────────────

// ── Main Component ─────────────────────────────────────────────────────────────
function WorkspaceIDE() {
  const router = useRouter();
  const params = useSearchParams();

  // ── Zustand stores ───────────────────────────────────────────────────────────
  const {
    files, activeFile, openTabs, history, showVersionHistory, showNewFile,
    setFiles, setActiveFile, setOpenTabs, setChangedFiles, setHistory, setShowVersionHistory, setShowNewFile,
    openFile, deleteFile: storeDeleteFile,
    updateFileContent: storeUpdateFileContent, pushHistory, revertHistory: storeRevertHistory,
    importFiles,
  } = useFileSystemStore();

  const {
    projectId, projectName,
    setProjectId, setProjectName, setProjects, setShowProjects,
  } = useProjectStore();

  const {
    aiInput, aiMsgs, aiLoading, streamingText, aiMode, selectedModelId,
    imageAtt, isRecording, showTemplates, autoFixCountdown, autoFixMode,
    showCompare, comparePrompt, showTeamPanel, teamAgents,
    setAiInput, setAiMsgs, setAiLoading, setStreamingText, setAgentPhase, setAiMode,
    setImageAtt, setIsRecording, setAutoFixCountdown, setAutoTesting,
    setShowTemplates, setShowCompare, setComparePrompt, setShowTeamPanel, setTeamAgents,
    persistAiMsgs,
    dispatchAgent,
  } = useAiStore();

  const {
    leftTab, leftW, rightW, consoleH, isFullPreview, previewWidth,
    deviceFrame, isMobile, mobilePanel, draggingLeft, draggingRight, draggingConsole,
    showConsole, bottomTab, multiPreview,
    setLeftTab, setLeftW, setRightW, setConsoleH, setShowConsole, setIsFullPreview,
    setDeviceFrame, setIsMobile, setMobilePanel,
    setDraggingLeft, setDraggingRight, setDraggingConsole,
    setBottomTab,
  } = useLayoutStore();

  const {
    previewSrc, iframeKey, hasRun, logs, errorCount,
    setPreviewSrc, setIframeKey, setHasRun, setPreviewRefreshing, setLogs, setErrorCount,
  } = usePreviewStore();

  const {
    setSplitMode, setSplitFile,
  } = useEditorStore();

  const {
    editingName, ctxMenu, toast, showCdnModal, customCdn, showEnvPanel,
    showUpgradeModal, showPublishModal, publishedUrl, publishing,
    showShortcuts, showOnboarding,
    setCtxMenu, setToast, showToast, setSaving, setShowCdnModal, setCustomCdn,
    setShowEnvPanel, setShowUpgradeModal, setShowPublishModal, setPublishedUrl, setPublishing,
    setShowCommandPalette, setShowShortcuts, setShowOnboarding,
  } = useUiStore();

  const {
    tokenBalance, showTopUp, topUpData,
    setTokenBalance, setMonthlyUsage, setShowTopUp, setTopUpData,
  } = useTokenStore();

  const {
    autonomyLevel, buildMode, commercialMode, agentMode, temperature, maxTokens, customSystemPrompt,
    setAutonomyLevel,
  } = useParameterStore();

  const {
    envVars, cdnUrls,
    setCdnUrls,
  } = useEnvStore();

  const {
    isCollabActive,
  } = useCollabStore();

  const setShowDeployPanel = useDeployStore(s => s.setShowDeployPanel);
  const setDeployConfig = useDeployStore(s => s.setDeployConfig);
  const startDeploy = useDeployStore(s => s.startDeploy);

  const handleVercelDeploy = useCallback(() => {
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("f9_vercel_token");
    setDeployConfig({ target: "vercel" });
    setShowDeployPanel(true);
    if (hasToken) {
      setTimeout(() => startDeploy(), 300);
    }
  }, [setShowDeployPanel, setDeployConfig, startDeploy]);

  // AI 디버거
  const [previewError, setPreviewError] = useState<string | null>(null);
  const handlePreviewError = useCallback((msg: string) => {
    setPreviewError(msg);
  }, []);

  // A/B Test state
  const [showAbTest, setShowAbTest] = useState(false);
  const [abVersionA, setAbVersionA] = useState<import('./ai/abTest').AbVersion>({ id: 'A', files: {}, status: 'generating', modelLabel: '' });
  const [abVersionB, setAbVersionB] = useState<import('./ai/abTest').AbVersion>({ id: 'B', files: {}, status: 'generating', modelLabel: '' });

  // 공유 링크
  const handleShareLink = useCallback(() => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(files)));
      const url = `${window.location.origin}/workspace?share=${encoded}`;
      navigator.clipboard.writeText(url);
      showToast?.("🔗 공유 링크가 클립보드에 복사됐습니다!");
    } catch { showToast?.("공유 링크 생성 실패"); }
  }, [files, showToast]);

  // Voice
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const abortTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // FIX 2
  const aiEndRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoFixAttempts = useRef(0);
  const qualityFixAttempts = useRef(0); // FIX 8 / FIX 22
  const templateAppliedAt = useRef(0);
  const filesRef = useRef(files);
  const cdnRef = useRef(cdnUrls);
  const envRef = useRef(envVars);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { cdnRef.current = cdnUrls; }, [cdnUrls]);
  useEffect(() => { envRef.current = envVars; }, [envVars]);

  // Auto-detect Sandpack mode
  useEffect(() => {
    const allContent = Object.values(files).map(f => f.content).join("\n");
    const needsSandpack = /from\s+['"](?!https?:\/\/)(?!\.\/)([a-z@][^'"]*)['"]/i.test(allContent);
    setSandpackMode(needsSandpack);
  }, [files]);

  // Editor visibility (hidden by default — Claude+Replit 2-panel layout)
  const [showEditor, setShowEditor] = useState(false);

  // v0.dev 2패널 탭 상태 (preview | code) — showEditor와 동기화
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  useEffect(() => { setShowEditor(activeTab === "code"); }, [activeTab]);

  // Mobile 2-tab simplified layout (chat | preview)
  const [mobileTab, setMobileTab] = useState<"chat" | "files" | "preview">("chat");

  // Extended mobile panel (3-panel: files | ai | preview)
  // Wraps the store's mobilePanel ("ai"|"preview") with additional "files" option
  const [mobilePanelExt, setMobilePanelExt] = useState<"files" | "ai" | "preview">(mobilePanel as "ai" | "preview");
  const setMobilePanelAll = useCallback((v: "files" | "ai" | "preview") => {
    setMobilePanelExt(v);
    if (v === "ai" || v === "preview") setMobilePanel(v);
  }, [setMobilePanel]);

  // Global image drag-over state (shows full-screen drop zone)
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragCounterRef = useRef(0);

  // Collab panel visibility
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const toggleCollabPanel = useCallback(() => setShowCollabPanel(p => !p), []);

  // New Tier-2 panel states
  const [showGitHubPanel, setShowGitHubPanel] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showSecretsPanel, setShowSecretsPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [showGitGraph, setShowGitGraph] = useState(false);
  const [showRemoteVersions, setShowRemoteVersions] = useState(false);
  const [sandpackMode, setSandpackMode] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-join collab room from URL param (?collab=roomId)
  useEffect(() => {
    const collabParam = params?.get("collab");
    if (collabParam && !isCollabActive) {
      setShowCollabPanel(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []); // eslint-disable-line

  // Swipe gesture for mobile panel switching (3-panel: files ↔ ai ↔ preview)
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (!isMobile) return;
      if (mobilePanelExt === "files") { setMobilePanelAll("ai"); hapticLight(); }
      else if (mobilePanelExt === "ai") { setMobilePanelAll("preview"); hapticLight(); }
    },
    onSwipeRight: () => {
      if (!isMobile) return;
      if (mobilePanelExt === "preview") { setMobilePanelAll("ai"); hapticLight(); }
      else if (mobilePanelExt === "ai") { setMobilePanelAll("files"); hapticLight(); }
    },
  });

  // Load project on mount + sync from server
  useEffect(() => {
    const forkSlug = params?.get("fork") ?? null;
    const autoQuery = params?.get("q") ?? null;

    // ── Fork: load published app HTML ──────────────────────────────────────
    if (forkSlug) {
      showToast("🍴 앱 포크 중...");
      fetch(`/api/published/${encodeURIComponent(forkSlug)}`)
        .then(r => r.json())
        .then(d => {
          if (!d.app) { showToast("⚠️ 앱을 찾을 수 없습니다"); return; }
          const newId = genId();
          const forkName = `${d.app.name} (포크)`;
          const forkFiles: FilesMap = { "index.html": { name: "index.html", content: d.app.html, language: "html" } };
          const proj: Project = { id: newId, name: forkName, files: forkFiles, updatedAt: new Date().toISOString() };
          saveProjectToStorage(proj);
          try { localStorage.setItem(CUR_KEY, newId); } catch { /* ignore */ }
          setFiles(forkFiles);
          setProjectName(forkName);
          setProjectId(newId);
          setOpenTabs(["index.html"]);
          setProjects(loadProjects());
          setTimeout(runProject, 300);
          showToast(`✅ "${forkName}" 포크 완료!`);
        })
        .catch(() => showToast("⚠️ 포크 실패 - 다시 시도해주세요"));
    } else {
      // 1. Load from localStorage first (instant)
      try {
        const id = localStorage.getItem(CUR_KEY);
        if (id) {
          const all = loadProjects();
          const proj = all.find(p => p.id === id);
          if (proj) {
            // 빈 files 보호: 서버 stub(files:{})은 DEFAULT_FILES 사용 — FIX 18: notify user
            const projFiles = proj.files ?? {};
            if (Object.keys(projFiles).length === 0) {
              showToast("⚠️ 저장된 파일이 없어 기본 파일을 불러왔습니다");
            }
            const safeFiles = Object.keys(projFiles).length > 0 ? projFiles : DEFAULT_FILES;
            setFiles(safeFiles);
            setProjectName(proj.name);
            setProjectId(id);
            setOpenTabs(Object.keys(safeFiles).slice(0, 5));

            // Auto-run preview if any file has substantial generated content
            // Check index.html specifically — generated apps always have long index.html
            const htmlFile = safeFiles["index.html"]?.content ?? "";
            const hasGenerated = htmlFile.length > 300 && !htmlFile.includes("✨ Dalkak AI IDE");
            if (hasGenerated) {
              setTimeout(() => {
                try {
                  let html = buildPreview(safeFiles);
                  if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
                  html = injectEnvVars(html, envRef.current);
                  html = injectSupabaseCdn(html, envRef.current);
                  setPreviewSrc(injectConsoleCapture(html));
                  setIframeKey(Date.now());
                  setHasRun(true);
                } catch { /* silent */ }
              }, 300);
            }
          }
        }
      } catch { /* localStorage 차단 시 무시, DEFAULT_FILES 유지 */ }
    }

    setProjects(loadProjects());
    setTokenBalance(getTokens());

    // 신규 사용자 온보딩 (최초 방문 시 1회)
    try {
      if (!localStorage.getItem("fn_onboarded")) {
        setTimeout(() => setShowOnboarding(true), 1200);
      }
    } catch { /* ignore */ }

    // 월별 사용량 조회 (Pro/Team) — FIX 16: 15s timeout
    {
      const ctrl1 = new AbortController();
      const tid1 = setTimeout(() => ctrl1.abort(), 15_000);
      fetch("/api/billing/usage", { signal: ctrl1.signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.metered) setMonthlyUsage(d.metered); })
        .catch(() => {})
        .finally(() => clearTimeout(tid1));
    }

    // ── Auto-query: pre-fill AI and trigger ────────────────────────────────
    if (autoQuery) {
      setAiInput(autoQuery);
      // Slight delay to let component mount fully
      setTimeout(() => {
        setAiInput(autoQuery);
      }, 800);
    }

    // 2. Sync token balance from server — FIX 16: 15s timeout
    {
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 15_000);
      fetch("/api/tokens", { signal: ctrl2.signal })
        .then(r => r.json())
        .then(d => { if (typeof d.balance === "number") { setTokenBalance(d.balance); setTokenStore(d.balance); } })
        .catch(() => {})
        .finally(() => clearTimeout(tid2));
    }

    // 3. Merge server projects into localStorage (background) — FIX 16: 15s timeout
    const ctrl3 = new AbortController();
    const tid3 = setTimeout(() => ctrl3.abort(), 15_000);
    fetch("/api/projects", { signal: ctrl3.signal })
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d.projects)) return;
        const local = loadProjects();
        const localIds = new Set(local.map((p: Project) => p.id));
        // Add server projects that aren't in localStorage (stubs without files)
        const merged = [...local];
        for (const sp of d.projects) {
          if (!localIds.has(sp.id)) merged.push({ id: sp.id, name: sp.name, files: {}, updatedAt: sp.updated_at });
        }
        try { localStorage.setItem(PROJ_KEY, JSON.stringify(merged.slice(0, 50))); } catch { /* ignore */ }
        setProjects(merged);
      })
      .catch(() => {})
      .finally(() => clearTimeout(tid3));
    // FIX 2 + FIX 14: cleanup abort timeout and voice recognition on unmount
    return () => {
      if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line
  }, []);

  // Auto-save (localStorage + server)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaving("saving");
    autoSaveTimer.current = setTimeout(() => {
      const proj: Project = { id: projectId, name: projectName, files: filesRef.current, updatedAt: new Date().toISOString() };
      saveProjectToStorage(proj);
      try { localStorage.setItem(CUR_KEY, projectId); } catch { /* ignore */ }
      setProjects(loadProjects());
      // Background server save
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, name: projectName, files: filesRef.current, updatedAt: proj.updatedAt }),
      })
        .then(() => { setSaving("saved"); setTimeout(() => setSaving("idle"), 2000); })
        .catch(() => { setSaving("idle"); showToast("⚠️ 서버 저장 실패 — 로컬에는 저장됨"); });
    }, 1500);
  }, [files, projectName, projectId]); // eslint-disable-line

  // AI history persistence
  useEffect(() => {
    persistAiMsgs();
  }, [aiMsgs]); // eslint-disable-line

  // Cleanup autoFix timer on project change
  useEffect(() => {
    if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); autoFixTimerRef.current = null; }
    setAutoFixCountdown(null);
    autoFixAttempts.current = 0;
  }, [projectId]); // eslint-disable-line

  // Auto-fix countdown: 에러 발생 후 자동 AI 수정 (autoFixMode=true 시 5초 카운트다운, 최대 3회, 템플릿 직후 억제)
  useEffect(() => {
    const MAX_AUTO_FIX = 3;
    const TEMPLATE_COOLDOWN = 3000; // 템플릿 적용 후 3초간 억제
    const AUTO_FIX_DELAY = 5; // 카운트다운 초
    const sinceTemplate = Date.now() - templateAppliedAt.current;
    // Only auto-fix for meaningful JS errors (SyntaxError, TypeError, ReferenceError) — skip minor warnings
    const hasFixableError = logs.some(l => l.level === "error" && /SyntaxError|TypeError|ReferenceError|Unexpected token|Unexpected identifier|Unexpected number|missing \)|missing ;|is not defined|Cannot read/i.test(l.msg));

    if (errorCount > 0 && hasFixableError && !aiLoading && autoFixAttempts.current < MAX_AUTO_FIX && sinceTemplate > TEMPLATE_COOLDOWN) {
      if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current);

      if (autoFixMode) {
        // autoFixMode ON: 5초 카운트다운 후 자동 수정
        setAutoFixCountdown(AUTO_FIX_DELAY);
        let remaining = AUTO_FIX_DELAY;
        autoFixTimerRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(autoFixTimerRef.current!);
            autoFixTimerRef.current = null;
            setAutoFixCountdown(null);
            autoFixAttempts.current++;
            autoFixErrors();
          } else {
            setAutoFixCountdown(remaining);
          }
        }, 1000) as unknown as ReturnType<typeof setInterval>;
      } else {
        // autoFixMode OFF: 카운트다운 없이 대기 (사용자가 수동으로 버튼 클릭)
        setAutoFixCountdown(null);
      }
    } else {
      if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current);
      setAutoFixCountdown(null);
    }
    return () => { if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); } };
  }, [errorCount, logs, autoFixMode]); // eslint-disable-line

  // Auto-scroll AI
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMsgs, streamingText]);
  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (showNewFile) newFileRef.current?.focus(); }, [showNewFile]);

  // Console capture
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "F9IDE") return;
      const entry: LogEntry = { level: e.data.level as LogLevel, msg: e.data.msg, ts: nowTs() };
      setLogs(p => [...p.slice(-199), entry]);
      if (e.data.level === "error") { setErrorCount(c => c + 1); setShowConsole(true); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []); // eslint-disable-line

  useEffect(() => {
    const h = () => { setCtxMenu(null); setShowProjects(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []); // eslint-disable-line

  // 공유 링크 로드
  useEffect(() => {
    const shareParam = params?.get("share");
    if (shareParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(shareParam)));
        if (decoded && typeof decoded === "object") {
          importFiles(decoded as FilesMap);
          showToast("🔗 공유 프로젝트를 불러왔습니다!");
          const url = new URL(window.location.href);
          url.searchParams.delete("share");
          window.history.replaceState({}, "", url.toString());
        }
      } catch { /* ignore malformed share */ }
    }
  }, []); // eslint-disable-line

  // 결제 성공 후 welcome 토스트
  useEffect(() => {
    if (params?.get("welcome") === "1") {
      setTimeout(() => showToast("🎉 결제 완료! Pro 플랜이 활성화되었습니다."), 800);
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.toString());
    }
  }, []); // eslint-disable-line

  // Debounced auto-run
  useEffect(() => {
    if (!hasRun) return;
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    setPreviewRefreshing(true);
    autoRunTimer.current = setTimeout(() => {
      try {
        let html = buildPreview(filesRef.current);
        if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
        html = injectEnvVars(html, envRef.current);
        html = injectSupabaseCdn(html, envRef.current);
        setPreviewSrc(injectConsoleCapture(html));
        setIframeKey(Date.now());
      } finally {
        setPreviewRefreshing(false);
      }
    }, 500);
    return () => { if (autoRunTimer.current) clearTimeout(autoRunTimer.current); };
  }, [files, cdnUrls]); // eslint-disable-line

  const runProject = useCallback(() => {
    setLogs([]); setErrorCount(0); autoFixAttempts.current = 0;
    let html = buildPreview(filesRef.current);
    if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
    html = injectEnvVars(html, envRef.current);
    html = injectSupabaseCdn(html, envRef.current);
    setPreviewSrc(injectConsoleCapture(html));
    setIframeKey(Date.now());
    setHasRun(true);
    showToast("▶ 실행됨");
  }, []); // eslint-disable-line

  useEffect(() => { runProject(); }, []); // eslint-disable-line

  // URL param auto-start
  useEffect(() => {
    const q = params?.get("q");
    const m = params?.get("mode");
    const a = params?.get("autonomy");
    if (a && ["low","medium","high","max"].includes(a)) setAutonomyLevel(a as "low" | "medium" | "high" | "max");
    if (q) {
      if (m) {
        // Sync both aiMode AND selectedModelId so they don't mismatch
        const MODE_DEFAULTS: Record<string, string> = {
          openai: "gpt-4o-mini", anthropic: "claude-haiku-4-5-20251001",
          gemini: "gemini-2.0-flash", grok: "grok-3",
        };
        setAiMode(m);
        if (MODE_DEFAULTS[m]) {
          useAiStore.getState().handleSelectModel(MODE_DEFAULTS[m], m);
        }
      }
      setLeftTab("ai");
      setTimeout(() => runAI(q, true), 400);
    } else if (useAiStore.getState().aiMsgs.length === 0) {
      // 첫 방문 — 환영 메시지
      setAiMsgs([{
        role: "agent",
        text: "안녕하세요! 무엇을 만들어드릴까요? 👋\n\n아이디어를 한 줄만 말씀해주세요. AI가 HTML·CSS·JS 전체를 자동으로 생성합니다.\n\n**예시:**\n- 테트리스 게임 만들어줘\n- 그림판 앱 만들어줘\n- 실시간 대시보드 만들어줘\n- 인터랙티브 지도 만들어줘",
        ts: nowTs(),
      }]);
    } else {
      // 이전 세션 메시지 있음 — 세션 구분선 추가
      setAiMsgs(p => [...p, { role: "agent", text: "── 새 세션 시작 ──", ts: nowTs() }]);
    }
  }, []); // eslint-disable-line

  // Drag handlers (mouse)
  const startDragLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingLeft(true);
    const onMove = (ev: MouseEvent) => setLeftW(Math.min(Math.max(ev.clientX, 180), 420));
    const onUp = () => { setDraggingLeft(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, []); // eslint-disable-line
  const startDragRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingRight(true);
    const onMove = (ev: MouseEvent) => setRightW(Math.min(Math.max(window.innerWidth - ev.clientX, 260), 800));
    const onUp = () => { setDraggingRight(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, []); // eslint-disable-line
  const startDragConsole = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingConsole(true);
    const startY = e.clientY; const startH = consoleH;
    const onMove = (ev: MouseEvent) => setConsoleH(Math.min(Math.max(startH + (startY - ev.clientY), 120), 400));
    const onUp = () => { setDraggingConsole(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [consoleH]); // eslint-disable-line

  // Drag handlers (touch — for tablet/mobile panel resize)
  const touchDragLeft = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); setDraggingLeft(true);
    const onMove = (ev: TouchEvent) => { ev.preventDefault(); setLeftW(Math.min(Math.max(ev.touches[0].clientX, 180), 420)); };
    const onEnd = () => { setDraggingLeft(false); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); document.removeEventListener("touchcancel", onEnd); };
    document.addEventListener("touchmove", onMove, { passive: false }); document.addEventListener("touchend", onEnd); document.addEventListener("touchcancel", onEnd);
  }, []); // eslint-disable-line
  const touchDragConsole = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); setDraggingConsole(true);
    const startY = e.touches[0].clientY; const startH = consoleH;
    const onMove = (ev: TouchEvent) => { ev.preventDefault(); setConsoleH(Math.min(Math.max(startH + (startY - ev.touches[0].clientY), 120), 400)); };
    const onEnd = () => { setDraggingConsole(false); document.removeEventListener("touchmove", onMove); document.removeEventListener("touchend", onEnd); document.removeEventListener("touchcancel", onEnd); };
    document.addEventListener("touchmove", onMove, { passive: false }); document.addEventListener("touchend", onEnd); document.addEventListener("touchcancel", onEnd);
  }, [consoleH]); // eslint-disable-line

  // File ops
  const handleSplitFileChange = useCallback((filename: string, content: string) => {
    storeUpdateFileContent(filename, content);
  }, []); // eslint-disable-line
  const toggleSplit = useCallback(() => {
    if (isMobile) return;
    setSplitMode(prev => {
      if (prev) return false;
      const other = openTabs.find(t => t !== activeFile && files[t]);
      if (!other) {
        showToast("분할할 파일이 없습니다");
        return false;
      }
      setSplitFile(other);
      return true;
    });
  }, [isMobile, openTabs, activeFile, files]); // eslint-disable-line
  const deleteFile = (name: string) => {
    storeDeleteFile(name);
    setCtxMenu(null);
  };

  // History / undo
  const revertHistory = useCallback(() => {
    storeRevertHistory();
    showToast("↩ 되돌리기 완료");
  }, []); // eslint-disable-line

  // ── React auto-detection: enable Sandpack when AI generates React code ──
  const autoDetectFramework = (updatedFiles: Record<string, { content: string }>) => {
    const allContent = Object.values(updatedFiles).map(f => f.content).join("\n");
    const hasReact = /import\s+React|from\s+['"]react['"]|ReactDOM\.createRoot|createRoot\(/.test(allContent);
    if (hasReact) {
      setSandpackMode(true);
    }
  };

  // Image attachment
  const handleImageFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast("⚠️ 이미지가 10MB를 초과합니다");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const commaIdx = result.indexOf(",");
      const meta = result.slice(0, commaIdx);
      const data = result.slice(commaIdx + 1);
      const mimeMatch = meta.match(/data:([^;]+)/);
      setImageAtt({ base64: data, mime: mimeMatch?.[1] ?? "image/png", preview: result });
    };
    reader.onerror = () => { showToast("⚠️ 이미지 읽기 실패"); };
    reader.readAsDataURL(file);
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const img = items.find(i => i.type.startsWith("image/"));
    if (img) { const f = img.getAsFile(); if (f) { handleImageFile(f); e.preventDefault(); } }
  };

  // Voice input
  const toggleVoice = () => {
    const w = window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { showToast("⚠️ 이 브라우저는 음성 입력을 지원하지 않습니다"); return; }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    let finalTranscript = "";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interim = event.results[i][0].transcript;
      }
      setAiInput(prev => prev + finalTranscript + interim);
      finalTranscript = "";
    };
    recognition.onend = () => { setIsRecording(false); };
    recognition.onerror = () => { setIsRecording(false); showToast("⚠️ 음성 인식 오류"); };
    recognition.start();
    setIsRecording(true);
    showToast("🎤 말씀하세요...");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
    if (f) handleImageFile(f);
  };

  // ── Global workspace drag-and-drop for screenshot→code ──
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    const hasImage = Array.from(e.dataTransfer.types).some(t => t === "Files");
    if (!hasImage) return;
    dragCounterRef.current++;
    setIsDraggingImage(true);
  };
  const handleGlobalDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setIsDraggingImage(false); }
  };
  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingImage(false);
    const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
    if (f) {
      handleImageFile(f);
      // Auto-focus AI chat panel and switch to AI tab
      if (!isMobile) {
        setLeftTab("ai");
      } else {
        setMobilePanelAll("ai");
      }
      setTimeout(() => {
        const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]');
        if (ta) { ta.focus(); }
      }, 100);
    }
  };

  // AI — guard flag prevents race condition from double-clicks
  const aiLockRef = useRef(false);
  const runAI = async (prompt: string, _isFirst = false) => {
    if (aiLoading || aiLockRef.current) return;
    aiLockRef.current = true;
    setAiLoading(true);
    const aiStartTime = Date.now();
    track("ai_generate_start", { model: selectedModelId, hasTemplate: Object.keys(filesRef.current ?? {}).length > 0 });
    dispatchAgent({ type: "START", prompt });
    setStreamingText("");
    const img = imageAtt;
    setImageAtt(null);
    setAiMsgs(p => [...p, { role: "user", text: prompt, ts: nowTs(), image: img?.preview }]);

    // ── Auto-name project from prompt (only if still default name and no code yet) ──
    const isDefaultName = ["내 프로젝트", "새 프로젝트", "My Project"].includes(projectName);
    // FIX 4: null-guard filesRef
    const currentFiles = filesRef.current;
    if (!currentFiles) { setAiLoading(false); aiLockRef.current = false; return; }
    const hasNoCode = !Object.values(currentFiles).some(f => f.content.length > 50);
    if (isDefaultName && hasNoCode) {
      // Strip action verbs and extract noun phrase as project name
      const autoName = prompt
        .replace(/만들어줘|만들어|해줘|해|주세요|please|create|make|build|generate/gi, "")
        .replace(/[,;!?]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(" ")
        .slice(0, 30)
        || prompt.slice(0, 20);
      if (autoName.length >= 2) setProjectName(autoName);
    }

    // ── Smart Router: intent detection ────────────────────────────────────────
    const hasExistingCode = Object.values(currentFiles).some(
      f => f.content.length > 200 && !f.content.includes("Dalkak IDE"),
    );
    const isQualityUpgrade = detectQualityUpgrade(prompt) && hasExistingCode;

    // ── #1 Quality Upgrade: refinement pipeline on existing code ────────────
    if (isQualityUpgrade) {
      const cost = calcCost(prompt);
      const bal = getTokens();
      // FIX 5: optimistic decrement, restore on error
      setTokenStore(Math.max(0, bal - cost));
      setTokenBalance(Math.max(0, bal - cost));
      fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: -cost }) }).catch(() => {});

      try {
        abortRef.current = new AbortController();
        pushHistory("품질 개선 전");
        dispatchAgent({ type: "STREAM_BEGIN" });

        const updated = { ...filesRef.current };
        const systemMsg = buildSystemPrompt({
          autonomyLevel: "max", buildMode: "full", customSystemPrompt,
          hasExistingFiles: true, modelId: selectedModelId, userPrompt: prompt,
        });

        const refinementCtx: RefinementContext = {
          originalPrompt: prompt,
          html: updated["index.html"]?.content ?? "",
          css: updated["style.css"]?.content ?? "",
          js: updated["script.js"]?.content ?? "",
          qualityScore: 50, // Force all phases to run
          platformType: detectPlatformType(prompt),
          iteration: 0,
        };
        const keyPhases = REFINEMENT_PHASES.filter(p => !p.skipIfPassing);

        setAiMsgs(p => [...p, {
          role: "agent",
          text: `✨ 품질 개선 시작 — ${keyPhases.length}단계 자동 파이프라인으로 상용급 업그레이드`,
          ts: nowTs(),
        }]);

        for (let ri = 0; ri < keyPhases.length; ri++) {
          const phase = keyPhases[ri];
          refinementCtx.iteration = ri;
          setStreamingText(`✨ ${phase.labelKo} (${ri + 1}/${keyPhases.length})`);
          try {
            const phaseRes = await fetch("/api/ai/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system: systemMsg,
                messages: [{ role: "user", content: phase.prompt(refinementCtx) }],
                mode: aiMode, model: selectedModelId, temperature,
                maxTokens: getModelMeta(selectedModelId)?.maxOutput ?? maxTokens,
              }),
              signal: abortRef.current.signal,
            });
            if (!phaseRes.ok) continue;
            const reader = phaseRes.body?.getReader();
            const dec = new TextDecoder();
            let acc = "";
            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                for (const line of dec.decode(value).split("\n")) {
                  if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                    try { const { text } = JSON.parse(line.slice(6)); if (text) acc += text; } catch {}
                  }
                }
              }
            }
            if (!acc.includes("모든 검증 통과")) {
              const parsed = parseAiResponse(acc);
              for (const [fname, content] of Object.entries(parsed.fullFiles)) {
                updated[fname] = { name: fname, language: extToLang(fname), content };
              }
              setFiles({ ...updated });
              autoDetectFramework(updated);
              refinementCtx.html = updated["index.html"]?.content ?? "";
              refinementCtx.css = updated["style.css"]?.content ?? "";
              refinementCtx.js = updated["script.js"]?.content ?? "";
            }
          } catch { /* skip failed phase */ }
          if (ri < keyPhases.length - 1) await new Promise(r => setTimeout(r, 300));
        }

        setStreamingText("");
        dispatchAgent({ type: "PHASE_CHANGE", phase: "reviewing" });
        const changedFiles = Object.keys(updated).filter(f => f !== "README.md");
        setChangedFiles(changedFiles);
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => { const next = [...p]; for (const f of changedFiles) if (!next.includes(f)) next.push(f); return next; });
        setTimeout(() => {
          let html = buildPreview(updated);
          if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
          html = injectEnvVars(html, envRef.current);
          html = injectSupabaseCdn(html, envRef.current);
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(Date.now());
          setHasRun(true); setLogs([]); setErrorCount(0);
        }, 100);
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `✅ ${keyPhases.length}단계 품질 개선 완료! 상용급으로 업그레이드됨`,
          ts: nowTs(),
        }]);
        setTimeout(() => autoTest(), 2200);
      } catch (err: unknown) {
        setStreamingText("");
        // FIX 5: restore balance on error
        setTokenStore(bal);
        setTokenBalance(bal);
        fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: cost }) }).catch(() => {});
        if ((err as Error)?.name !== "AbortError") {
          const userFriendlyError = (err as Error)?.message?.slice(0, 100) ?? "연결 실패"; // FIX 17
          setAiMsgs(p => [...p, { role: "agent", text: `⚠️ 품질 개선 오류: ${userFriendlyError}`, ts: nowTs() }]);
        }
      }
      dispatchAgent({ type: "COMPLETE" });
      dispatchAgent({ type: "RESET" });
      setAiLoading(false);
      aiLockRef.current = false;
      abortRef.current = null;
      return;
    }

    // ── #2 Template instant-apply (skip when commercial mode ON) ────────────
    if (!commercialMode) {
      const instantTpl = matchTemplate(prompt, "strict");
      if (instantTpl) {
        const updated = { ...filesRef.current, ...instantTpl };
        setFiles(updated);
        setChangedFiles(Object.keys(instantTpl));
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => { const next = [...p]; for (const f of Object.keys(instantTpl)) if (!next.includes(f)) next.push(f); return next; });
        setActiveFile("index.html");
        pushHistory("템플릿 적용 전");
        templateAppliedAt.current = Date.now();
        autoFixAttempts.current = 0;
        setHasRun(true); setLogs([]); setErrorCount(0); // 먼저 세팅 → debounced auto-run fallback 활성화
        setTimeout(() => {
          try {
            let html = buildPreview(updated);
            if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
            html = injectEnvVars(html, envRef.current);
            html = injectSupabaseCdn(html, envRef.current);
            setPreviewSrc(injectConsoleCapture(html));
            setIframeKey(Date.now());
          } catch (err) {
            console.error('[Template] preview build failed, debounced auto-run will retry:', err);
          }
        }, 50);
        setTimeout(() => autoTest(), 2200);
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `🎮 내장 템플릿으로 즉시 생성했습니다! 게임을 플레이해보세요.\n\n에러가 발생하면 자동으로 수정합니다.`,
          ts: nowTs(),
        }]);
        setAiLoading(false);
        aiLockRef.current = false;
        dispatchAgent({ type: "COMPLETE" });
        dispatchAgent({ type: "RESET" });
        return; // AI 호출 건너뛰기
      }
    }

    // Token tracking (UI display only — actual limits enforced server-side)
    const cost = calcCost(prompt);
    const bal = getTokens();
    const newBal = Math.max(0, bal - cost);
    // FIX 20: show estimated cost in streaming indicator before request
    setStreamingText(`🔄 생성 중... (예상 ~${cost}토큰)`);
    setTokenStore(newBal);
    setTokenBalance(newBal);
    fetch("/api/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: -cost }),
    }).catch(() => {});

    // ── #3+#4 Commercial pipeline (auto-detect OR forced by commercial mode) ─
    // 플랫폼 키워드 감지 시 또는 상용급 모드 활성 시 상용급 파이프라인 실행
    const pipeline = commercialMode ? (detectCommercialRequest(prompt, hasExistingCode) ?? buildForcedPipeline(prompt)) : detectCommercialRequest(prompt, hasExistingCode);
    if (pipeline) {
      try {
        abortRef.current = new AbortController();
        pushHistory("상용급 생성 전");
        dispatchAgent({ type: "STREAM_BEGIN" });

        const hasRealFiles = Object.values(filesRef.current).some(
          f => f.content.length > 200 && !f.content.includes("Dalkak IDE")
        );

        // ── LM integration: auto-upgrade model for commercial pipeline ────
        // If current model has low output capacity, auto-switch to the best
        // high-output model available for this provider.
        let pipelineModelId = selectedModelId;
        let pipelineMode = aiMode;
        const modelMeta = getModelMeta(selectedModelId);
        const effectiveMaxTokens = modelMeta?.maxOutput ?? maxTokens ?? 16384;

        // Auto-upgrade only when model is completely unknown (not in registry)
        // Known low-output models (Haiku, etc.) are used as-is — user chose them intentionally
        if (!modelMeta) {
          const bestModel = getBestModelForTask("code");
          if (bestModel) {
            pipelineModelId = bestModel.id;
            pipelineMode = bestModel.provider;
            showToast(`🔄 상용급 생성: ${bestModel.label}으로 자동 전환됨`);
          }
        } else if (modelMeta.maxOutput < 4096) {
          showToast(`⚠️ ${modelMeta.label}의 최대 출력이 제한적입니다. Claude Sonnet 4.6 권장`);
        }

        // High-complexity auto-upgrade: 쇼핑몰·게임·대시보드 등 복잡한 앱은 Sonnet으로 자동 전환
        // (Haiku 4096 토큰으로는 완성 품질 보장 불가)
        if (detectHighComplexity(prompt) && modelMeta?.cost === "$") {
          pipelineModelId = "claude-sonnet-4-6";
          pipelineMode = "anthropic";
          showToast("⭐ 고품질 앱 감지 → Sonnet으로 생성");
        }

        const pipelineSystemMsg = buildSystemPrompt({
          autonomyLevel: "max",
          buildMode: "full",
          customSystemPrompt,
          hasExistingFiles: hasRealFiles,
          modelId: pipelineModelId,
          userPrompt: prompt,
        });

        const stepOutputs: Record<string, string> = {};
        const updated = { ...filesRef.current };

        // ── Team Pipeline (new parallel architecture) ──────────────────────
        // Replaces sequential 3-step + 5-phase with parallel team agents
        // Speed: 120s → 31s (4x faster)
        const runTeamPipeline = async (
          userPrompt: string,
          platformType: string | null,
          systemMsg: string,
          mode: string,
          modelId: string,
          updatedFiles: FilesMap,
        ) => {
          const _teamStartTs = Date.now();
          // ── PHASE 1: Architect (Haiku, ~3s) ──────────────────────────────
          setStreamingText(getTeamPipelineLabel('architect'));

          const architectReq: BuilderRequest = {
            prompt: buildArchitectPrompt(userPrompt, platformType),
            system: "You are a web app architect. Output only valid JSON.",
            mode: "anthropic",
            modelId: "claude-haiku-4-5-20251001",
            maxTokens: 1024,
          };

          const architectRaw = await runSingleStream(architectReq);
          const spec: ArchitectSpec = parseArchitectResponse(architectRaw) ?? {
            layout: 'single-page',
            colorScheme: { primary: '#f97316', background: '#050508', surface: '#0f0f1a', text: '#e2e8f0', accent: '#8b5cf6' },
            typography: { headingFont: 'Pretendard', bodyFont: 'Pretendard' },
            components: [],
            cssClasses: [],
            theme: 'dark',
            platformType,
            features: [],
          };

          // ── PHASE 2: Parallel HTML + CSS + JS (Sonnet, ~15s) ─────────────
          setStreamingText(getTeamPipelineLabel('building'));

          const parallelRequests = {
            html: {
              prompt: buildHtmlPrompt(spec, userPrompt, platformType),
              system: systemMsg,
              mode,
              modelId,
              maxTokens: 8192,
            },
            css: {
              prompt: buildCssPrompt(spec, userPrompt, platformType),
              system: systemMsg,
              mode,
              modelId,
              maxTokens: 8192,
            },
            js: {
              prompt: buildJsPrompt(spec, userPrompt, platformType),
              system: systemMsg,
              mode,
              modelId,
              maxTokens: 8192,
            },
          };

          // Progressive preview — update as each file arrives
          // Track which file is actively streaming for cursor display
          const buildResult = await runParallelBuilders(parallelRequests, (event) => {
            // ── Live streaming: update editor content with partial chunks ──
            if (event.status === 'chunk' && event.partial) {
              const chunkFileMap: Record<string, string> = {
                html: 'index.html',
                css: 'style.css',
                js: 'script.js',
              };
              const chunkFname = chunkFileMap[event.phase];
              if (chunkFname && event.partial.length > 80) {
                // Strip [FILE:filename] wrapper from partial content
                const partialContent = event.partial
                  .replace(/^\[FILE:[^\]]+\]\n?/, '')
                  .replace(/\n?\[\/FILE\][\s\S]*$/, '');
                if (partialContent.length > 30) {
                  updatedFiles[chunkFname] = {
                    name: chunkFname,
                    language: extToLang(chunkFname),
                    content: partialContent,
                  };
                  setFiles({ ...updatedFiles });
                  // Auto-switch active tab to the file being generated
                  setActiveFile(chunkFname);
                }
              }
            }

            if (event.status === 'done' && event.file) {
              const fileMap: Record<string, string> = {
                html: 'index.html',
                css: 'style.css',
                js: 'script.js',
              };
              const fname = fileMap[event.phase];
              if (fname && event.file.length > 100) {
                const fileContent = event.file.includes('[/FILE]')
                  ? event.file.replace(/^[\s\S]*?\[FILE:[^\]]+\]\n?/, '').replace(/\n?\[\/FILE\][\s\S]*$/, '').trim()
                  : event.file;
                updatedFiles[fname] = { name: fname, language: extToLang(fname), content: fileContent };
                setFiles({ ...updatedFiles });
                if (fname === 'index.html' || (updatedFiles['index.html'] && updatedFiles['style.css'])) {
                  try {
                    let liveHtml = buildPreview(updatedFiles);
                    if (cdnRef.current.length > 0) liveHtml = injectCdns(liveHtml, cdnRef.current);
                    liveHtml = injectEnvVars(liveHtml, envRef.current);
                    liveHtml = injectSupabaseCdn(liveHtml, envRef.current);
                    setPreviewSrc(injectConsoleCapture(liveHtml));
                    setHasRun(true);
                  } catch { /* partial preview — ignore */ }
                }
                const doneLabel = fname === 'index.html' ? 'html-done' : fname === 'style.css' ? 'css-done' : 'js-done';
                setStreamingText(getTeamPipelineLabel(doneLabel));
              }
            }
          });

          // Apply final results
          if (buildResult.html) updatedFiles['index.html'] = { name: 'index.html', language: extToLang('index.html'), content: buildResult.html };
          if (buildResult.css) updatedFiles['style.css'] = { name: 'style.css', language: extToLang('style.css'), content: buildResult.css };
          if (buildResult.js) updatedFiles['script.js'] = { name: 'script.js', language: extToLang('script.js'), content: buildResult.js };
          setFiles({ ...updatedFiles } as import("./workspace.constants").FilesMap);
          try {
            let finalHtml = buildPreview(updatedFiles);
            if (cdnRef.current.length > 0) finalHtml = injectCdns(finalHtml, cdnRef.current);
            finalHtml = injectEnvVars(finalHtml, envRef.current);
            finalHtml = injectSupabaseCdn(finalHtml, envRef.current);
            setPreviewSrc(injectConsoleCapture(finalHtml));
          } catch { /* ignore */ }

          // ── PHASE 3: Critic (Haiku, ~5s) ─────────────────────────────────
          const html = buildResult.html;
          const css = buildResult.css;
          const js = buildResult.js;
          let _finalCriticScore = 80; // hoisted for stats tracking

          if (shouldRunCritic(html, css, js)) {
            setStreamingText(getTeamPipelineLabel('critic'));

            const streamFn = (req: BuilderRequest) => runSingleStream(req);
            const criticReport = await runCriticAnalysis(html, css, js, streamFn);
            _finalCriticScore = criticReport.score;

            // Fire-and-forget quality score save — never blocks generation
            fetch("/api/quality/scores", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appName: userPrompt.slice(0, 50),
                score: criticReport.score,
                issuesCount: criticReport.issues.length,
                pipelineType: "team",
                platform: platformType ?? undefined,
              }),
            }).catch(() => {});

            // ── PHASE 4: Patcher (Sonnet, ~8s) — only if needed ──────────
            if (!criticReport.passed && criticReport.issues.length > 0) {
              setStreamingText(getTeamPipelineLabel('patching', String(criticReport.issues.length)));

              const patchResult = await runPatcherFix(criticReport, html, css, js, streamFn);

              if (patchResult.html !== html) updatedFiles['index.html'] = { name: 'index.html', language: extToLang('index.html'), content: patchResult.html };
              if (patchResult.css !== css) updatedFiles['style.css'] = { name: 'style.css', language: extToLang('style.css'), content: patchResult.css };
              if (patchResult.js !== js) updatedFiles['script.js'] = { name: 'script.js', language: extToLang('script.js'), content: patchResult.js };
              setFiles({ ...updatedFiles } as import("./workspace.constants").FilesMap);
            }

            const qualityNote = criticReport.passed
              ? `\n📊 품질 점수: ${criticReport.score}/100 ✅`
              : `\n📊 품질 점수: ${criticReport.score}/100 — ${criticReport.issues.length}개 문제 수정됨`;
            setAiMsgs(p => [...p, { role: 'agent' as const, text: `⚡ 팀 에이전트 생성 완료${qualityNote}`, ts: nowTs() }]);
          }

          // ── Save pipeline performance stats to localStorage ───────────
          try {
            const _teamDuration = Date.now() - _teamStartTs;
            const _statsRaw = typeof window !== "undefined"
              ? localStorage.getItem("dalkak_pipeline_stats")
              : null;
            const _statsObj = _statsRaw ? JSON.parse(_statsRaw) as {
              team?: { totalRuns: number; totalDuration: number; totalScore: number; lastRun: string | null };
            } : {};
            const _prev = _statsObj.team ?? { totalRuns: 0, totalDuration: 0, totalScore: 0, lastRun: null };
            _statsObj.team = {
              totalRuns: _prev.totalRuns + 1,
              totalDuration: _prev.totalDuration + _teamDuration,
              totalScore: _prev.totalScore + _finalCriticScore,
              lastRun: new Date().toISOString(),
            };
            if (typeof window !== "undefined") {
              localStorage.setItem("dalkak_pipeline_stats", JSON.stringify(_statsObj));
              // Trigger storage event for same-tab listeners
              window.dispatchEvent(new StorageEvent("storage", {
                key: "dalkak_pipeline_stats",
                newValue: JSON.stringify(_statsObj),
              }));
            }
          } catch { /* localStorage unavailable — ignore */ }

          setStreamingText(getTeamPipelineLabel('done'));

          // Final preview refresh
          try {
            let doneHtml = buildPreview(updatedFiles);
            if (cdnRef.current.length > 0) doneHtml = injectCdns(doneHtml, cdnRef.current);
            doneHtml = injectEnvVars(doneHtml, envRef.current);
            doneHtml = injectSupabaseCdn(doneHtml, envRef.current);
            setPreviewSrc(injectConsoleCapture(doneHtml));
          } catch { /* ignore */ }
          setHasRun(true);
          setIframeKey(k => k + 1);

          return updatedFiles;
        };

        // Route to team pipeline for commercial requests
        try {
          await runTeamPipeline(
            prompt,
            pipeline.platformType ?? null,
            pipelineSystemMsg,
            pipelineMode,
            pipelineModelId,
            updated,
          );

          // Team pipeline succeeded — skip legacy sequential pipeline
          // Jump to final preview/save/quality block
          setStreamingText("");
          dispatchAgent({ type: "PHASE_CHANGE", phase: "reviewing" });
          const teamChangedFiles = Object.keys(updated).filter(f => f !== "README.md");
          setChangedFiles(teamChangedFiles);
          setTimeout(() => setChangedFiles([]), 3000);
          setOpenTabs(p => { const next = [...p]; for (const f of teamChangedFiles) if (!next.includes(f)) next.push(f); return next; });

          try {
            const proj: Project = { id: projectId, name: projectName, files: updated, updatedAt: new Date().toISOString() };
            saveProjectToStorage(proj);
            localStorage.setItem(CUR_KEY, projectId);
          } catch { /* ignore */ }

          autoFixAttempts.current = 0;
          setTimeout(() => autoTest(), 2200);
          track("ai_generate_complete", { model: selectedModelId, pipeline: "team", duration: Math.round((Date.now() - aiStartTime) / 1000) });
          fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiInput.trim(), app_name: aiMsgs[0]?.text?.slice(0, 60), model_id: selectedModelId }) }).catch(() => {});
          setAiLoading(false);
          aiLockRef.current = false;
          dispatchAgent({ type: "COMPLETE" });
          dispatchAgent({ type: "RESET" });
          return;
        } catch (teamErr) {
          console.warn('[team-pipeline] failed, falling back to legacy:', teamErr);
          // Fall through to legacy pipeline below
        }

        for (let i = 0; i < pipeline.steps.length; i++) {
          const step = pipeline.steps[i];
          setStreamingText(getStepLabel(step.phase, i, pipeline.steps.length));
          dispatchAgent({ type: "PHASE_CHANGE", phase: "coding" });

          const stepPrompt = buildStepPrompt(step, stepOutputs);
          const pipelineMeta = getModelMeta(pipelineModelId);
          const stepMaxTokens = pipelineMeta?.maxOutput ?? effectiveMaxTokens;
          const stepBody: Record<string, unknown> = {
            system: pipelineSystemMsg,
            messages: [{ role: "user", content: stepPrompt }],
            mode: pipelineMode,
            model: pipelineModelId,
            temperature,
            maxTokens: stepMaxTokens,
          };

          const res = await fetch("/api/ai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stepBody),
            signal: abortRef.current.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} at step ${i + 1}`);

          const reader = res.body?.getReader();
          const dec = new TextDecoder();
          let acc = "";
          // ── Streaming preview: show live partial results as each file block completes ──
          let livePreviewTs = 0;
          const livePreviewedKeys = new Set<string>(); // "fname:len" — avoid re-rendering unchanged files
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              for (const line of dec.decode(value).split("\n")) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const { text } = JSON.parse(line.slice(6));
                    if (text) acc += text;
                  } catch {}
                }
              }
              // Check for newly completed [FILE:...]...[/FILE] blocks (throttled to 800ms)
              const nowMs = Date.now();
              if (nowMs - livePreviewTs > 800 && acc.includes("[/FILE]")) {
                const partialParsed = parseAiResponse(acc);
                let hasNewFile = false;
                for (const [fname, content] of Object.entries(partialParsed.fullFiles)) {
                  const key = `${fname}:${content.length}`;
                  if (!livePreviewedKeys.has(key)) {
                    livePreviewedKeys.add(key);
                    updated[fname] = { name: fname, language: extToLang(fname), content };
                    hasNewFile = true;
                  }
                }
                if (hasNewFile) {
                  setFiles({ ...updated });
                  try {
                    let liveHtml = buildPreview(updated);
                    if (cdnRef.current.length > 0) liveHtml = injectCdns(liveHtml, cdnRef.current);
                    liveHtml = injectEnvVars(liveHtml, envRef.current);
                    liveHtml = injectSupabaseCdn(liveHtml, envRef.current);
                    setPreviewSrc(injectConsoleCapture(liveHtml));
                    setHasRun(true); setLogs([]); setErrorCount(0);
                    // No iframeKey change during streaming — avoid full remount flicker
                  } catch { /* buildPreview may fail on partial files — ignore */ }
                }
                livePreviewTs = nowMs;
              }
            }
          }

          // Parse and apply this step's output
          const parsed = parseAiResponse(acc);
          for (const [fname, content] of Object.entries(parsed.fullFiles)) {
            updated[fname] = { name: fname, language: extToLang(fname), content };
          }
          stepOutputs[step.id] = acc;
          setFiles({ ...updated });
          autoDetectFramework(updated);

          // ── Per-step truncation detection: immediately retry with simplified scope ──
          const stepContent = updated[step.targetFile]?.content ?? "";
          if (isFileTruncated(stepContent, step.targetFile)) {
            setAiMsgs(p => [...p, {
              role: "agent",
              text: `⚠️ ${step.targetFile} 생성이 잘렸습니다. 코드 단순화 후 재생성 중...`,
              ts: nowTs(),
            }]);
            setStreamingText(`🔄 ${step.targetFile} 재생성 중...`);
            const retryPrompt = buildStepPrompt(step, stepOutputs) +
              `\n\n## TRUNCATION RETRY — CRITICAL:\n이전 응답이 너무 길어 잘렸습니다. 다음 규칙을 반드시 지켜 재작성하세요:\n- 최대 250줄 이내로 완성\n- 핵심 기능만 구현 (파티클/사운드/복잡한 애니메이션 제거)\n- 모든 함수를 반드시 닫고 절대 중간에 자르지 마세요`;
            try {
              // Sonnet fallback: if current model has limited output (Haiku ≤4096), upgrade retry to Sonnet
              const truncRetryMeta = getModelMeta(pipelineModelId);
              const useSonnetFallback = truncRetryMeta != null && truncRetryMeta.maxOutput <= 4096;
              const truncRetryId = useSonnetFallback ? "claude-sonnet-4-6" : pipelineModelId;
              const truncRetryMode = useSonnetFallback ? "anthropic" : pipelineMode;
              if (useSonnetFallback) showToast("🔄 출력 한계 감지 → Sonnet으로 재생성");
              const retryRes = await fetch("/api/ai/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...stepBody, mode: truncRetryMode, model: truncRetryId, maxTokens: 8192, messages: [{ role: "user", content: retryPrompt }] }),
                signal: abortRef.current?.signal,
              });
              if (retryRes.ok) {
                const rdr = retryRes.body?.getReader();
                const rdec = new TextDecoder();
                let racc = "";
                if (rdr) {
                  while (true) {
                    const { done, value } = await rdr.read();
                    if (done) break;
                    for (const ln of rdec.decode(value).split("\n")) {
                      if (ln.startsWith("data: ") && !ln.includes("[DONE]")) {
                        try { const { text } = JSON.parse(ln.slice(6)); if (text) racc += text; } catch {}
                      }
                    }
                  }
                }
                if (racc) {
                  const rp = parseAiResponse(racc);
                  for (const [fn, ct] of Object.entries(rp.fullFiles)) {
                    updated[fn] = { name: fn, language: extToLang(fn), content: ct };
                  }
                  stepOutputs[step.id] = racc;
                  setFiles({ ...updated });
                  autoDetectFramework(updated);
                }
              }
            } catch { /* retry failed, autoFix will handle downstream */ }
          }

          // ── JS syntax validation: if step-js has a syntax error, retry once ──
          if (step.id === "step-js") {
            const jsContent = updated["script.js"]?.content ?? "";
            let hasSyntaxErr = false;
            try { new Function(jsContent); } catch (e) {
              const msg = (e as Error).message ?? "";
              // Ignore known false positives (async/await, optional chaining, JSX)
              if (!/Unexpected token '\.'|Unexpected token '\?'|Unexpected token '<'/i.test(msg)) {
                hasSyntaxErr = true;
              }
            }
            if (hasSyntaxErr) {
              setStreamingText("🔧 JS 구문 오류 감지 — 자동 수정 중...");
              const syntaxFixPrompt = buildStepPrompt(step, stepOutputs) +
                `\n\n## SYNTAX FIX REQUIRED:\n이전 script.js에 구문 오류가 있습니다. 반드시 지켜주세요:\n- 모든 변수는 let/const/var로 선언\n- 모든 { }를 올바르게 짝 맞추기\n- 모든 문자열 따옴표를 올바르게 닫기\n- 줄 끝에 세미콜론 삽입\n- 최대 200줄로 완성 (truncation 방지)\n[FILE:script.js]...[/FILE]로 출력`;
              try {
                // Sonnet fallback for syntax fix: Haiku often generates broken JS — upgrade to Sonnet
                const sfRetryMeta = getModelMeta(pipelineModelId);
                const sfUseSonnet = sfRetryMeta != null && sfRetryMeta.maxOutput <= 4096;
                const sfRetryId = sfUseSonnet ? "claude-sonnet-4-6" : pipelineModelId;
                const sfRetryMode = sfUseSonnet ? "anthropic" : pipelineMode;
                if (sfUseSonnet) showToast("🔧 JS 구문 오류 → Sonnet으로 수정");
                const sfRes = await fetch("/api/ai/stream", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...stepBody, mode: sfRetryMode, model: sfRetryId, maxTokens: 8192, messages: [{ role: "user", content: syntaxFixPrompt }] }),
                  signal: abortRef.current?.signal,
                });
                if (sfRes.ok) {
                  const sfRdr = sfRes.body?.getReader();
                  const sfDec = new TextDecoder();
                  let sfAcc = "";
                  if (sfRdr) {
                    while (true) {
                      const { done, value } = await sfRdr.read();
                      if (done) break;
                      for (const ln of sfDec.decode(value).split("\n")) {
                        if (ln.startsWith("data: ") && !ln.includes("[DONE]")) {
                          try { const { text } = JSON.parse(ln.slice(6)); if (text) sfAcc += text; } catch {}
                        }
                      }
                    }
                  }
                  if (sfAcc) {
                    const sfp = parseAiResponse(sfAcc);
                    for (const [fn, ct] of Object.entries(sfp.fullFiles)) {
                      updated[fn] = { name: fn, language: extToLang(fn), content: ct };
                    }
                    setFiles({ ...updated });
                    autoDetectFramework(updated);
                  }
                }
              } catch { /* syntax fix failed, autoFix will handle */ }
            }
          }

          // Track additional token cost for steps 2+
          if (i > 0) {
            const extraCost = calcCost(stepPrompt);
            const curBal = getTokens();
            setTokenStore(Math.max(0, curBal - extraCost));
            setTokenBalance(Math.max(0, curBal - extraCost));
            fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: -extraCost }) }).catch(() => {});
          }

          // Brief pause between steps
          if (i < pipeline.steps.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }

        // ── #4 Refinement Pipeline: 5-phase auto-improvement ────────────────
        const preRefineContents: Record<string, string> = {};
        for (const [k, v] of Object.entries(updated)) preRefineContents[k] = v.content;
        const preRefineQ = validateCommercialQuality(preRefineContents, pipeline.platformType);

        const refinementCtx: RefinementContext = {
          originalPrompt: prompt,
          html: updated["index.html"]?.content ?? "",
          css: updated["style.css"]?.content ?? "",
          js: updated["script.js"]?.content ?? "",
          qualityScore: preRefineQ.score,
          platformType: pipeline.platformType,
          iteration: 0,
        };
        const phasesToRun = getPhasesToRun(REFINEMENT_PHASES, preRefineQ.score);

        if (phasesToRun.length > 0) {
          setAiMsgs(p => [...p, {
            role: "agent",
            text: `✨ ${phasesToRun.length}단계 자동 개선 파이프라인 시작 (품질: ${preRefineQ.score}/100)`,
            ts: nowTs(),
          }]);

          for (let ri = 0; ri < phasesToRun.length; ri++) {
            const phase = phasesToRun[ri];
            refinementCtx.iteration = ri;
            setStreamingText(`✨ ${phase.labelKo} (${ri + 1}/${phasesToRun.length})`);

            const phasePrompt = phase.prompt(refinementCtx);
            // Refinement always uses Sonnet for maximum output quality (8192 tokens)
            const phaseBody = {
              system: pipelineSystemMsg,
              messages: [{ role: "user", content: phasePrompt }],
              mode: "anthropic",
              model: "claude-sonnet-4-6",
              temperature,
              maxTokens: 8192,
            };

            try {
              const phaseRes = await fetch("/api/ai/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(phaseBody),
                signal: abortRef.current?.signal,
              });
              if (!phaseRes.ok) continue;

              const phaseReader = phaseRes.body?.getReader();
              const phaseDec = new TextDecoder();
              let phaseAcc = "";
              let phasePreviewTs = 0;
              const phasePreviewedKeys = new Set<string>();
              if (phaseReader) {
                while (true) {
                  const { done, value } = await phaseReader.read();
                  if (done) break;
                  for (const line of phaseDec.decode(value).split("\n")) {
                    if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                      try { const { text } = JSON.parse(line.slice(6)); if (text) phaseAcc += text; } catch {}
                    }
                  }
                  // Live preview during refinement (throttled 1s — refinement produces large diffs)
                  const phaseNow = Date.now();
                  if (phaseNow - phasePreviewTs > 1000 && phaseAcc.includes("[/FILE]")) {
                    const pp = parseAiResponse(phaseAcc);
                    let phaseHasNew = false;
                    for (const [fn, ct] of Object.entries(pp.fullFiles)) {
                      const k = `${fn}:${ct.length}`;
                      if (!phasePreviewedKeys.has(k)) {
                        phasePreviewedKeys.add(k);
                        updated[fn] = { name: fn, language: extToLang(fn), content: ct };
                        phaseHasNew = true;
                      }
                    }
                    if (phaseHasNew) {
                      setFiles({ ...updated });
                      try {
                        let ph = buildPreview(updated);
                        if (cdnRef.current.length > 0) ph = injectCdns(ph, cdnRef.current);
                        ph = injectEnvVars(ph, envRef.current);
                        ph = injectSupabaseCdn(ph, envRef.current);
                        setPreviewSrc(injectConsoleCapture(ph));
                        setHasRun(true); setLogs([]); setErrorCount(0);
                      } catch {}
                    }
                    phasePreviewTs = phaseNow;
                  }
                }
              }

              if (!phaseAcc.includes("모든 검증 통과")) {
                const phaseParsed = parseAiResponse(phaseAcc);
                // Save previous JS before applying phase changes (for rollback)
                const prevJs = updated["script.js"]?.content ?? "";
                for (const [fname, content] of Object.entries(phaseParsed.fullFiles)) {
                  updated[fname] = { name: fname, language: extToLang(fname), content };
                }
                // ── Refinement JS syntax guard: rollback if phase broke script.js ──
                const newJs = updated["script.js"]?.content ?? "";
                if (newJs && newJs !== prevJs) {
                  let refJsSyntaxErr = false;
                  try { new Function(newJs); } catch (e) {
                    const em = (e as Error).message ?? "";
                    if (!/Unexpected token '\.'|Unexpected token '\?'|Unexpected token '<'/i.test(em)) {
                      refJsSyntaxErr = true;
                    }
                  }
                  if (refJsSyntaxErr && prevJs) {
                    // Rollback JS to previous working version, keep other file changes
                    updated["script.js"] = { name: "script.js", language: "javascript", content: prevJs };
                    showToast("⚠️ 개선 중 JS 구문 오류 → 이전 버전으로 복구");
                  }
                }
                setFiles({ ...updated });
                autoDetectFramework(updated);
                refinementCtx.html = updated["index.html"]?.content ?? "";
                refinementCtx.css = updated["style.css"]?.content ?? "";
                refinementCtx.js = updated["script.js"]?.content ?? "";
              }
            } catch { /* skip failed phase */ }

            if (ri < phasesToRun.length - 1) await new Promise(r => setTimeout(r, 300));
          }
        }

        // ── #1 Self-Refine Loop: AI self-evaluates and iterates ─────────────
        let refineRound = 0;
        const maxRefineRounds = 2; // Keep it fast
        while (refineRound < maxRefineRounds) {
          setStreamingText(`🔄 자체 평가 라운드 ${refineRound + 1}/${maxRefineRounds}`);
          const evalCtx = {
            html: updated["index.html"]?.content ?? "",
            css: updated["style.css"]?.content ?? "",
            js: updated["script.js"]?.content ?? "",
            originalPrompt: prompt,
          };
          try {
            const evalRes = await fetch("/api/ai/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system: "You are a code quality evaluator. Output ONLY valid JSON.",
                messages: [{ role: "user", content: buildSelfEvalPrompt(evalCtx) }],
                mode: "anthropic", model: "claude-haiku-4-5-20251001", temperature: 0.3, maxTokens: 1024,
              }),
              signal: abortRef.current?.signal,
            });
            if (!evalRes.ok) break;

            const evalReader = evalRes.body?.getReader();
            const evalDec = new TextDecoder();
            let evalAcc = "";
            if (evalReader) {
              while (true) {
                const { done, value } = await evalReader.read();
                if (done) break;
                for (const line of evalDec.decode(value).split("\n")) {
                  if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                    try { const { text } = JSON.parse(line.slice(6)); if (text) evalAcc += text; } catch {}
                  }
                }
              }
            }

            const evaluation = parseSelfEvaluation(evalAcc);
            if (!shouldContinueRefining(evaluation, refineRound, { maxRounds: maxRefineRounds, targetScore: 8 })) {
              if (evaluation) {
                setAiMsgs(p => [...p, {
                  role: "agent",
                  text: `📊 자체 평가: 디자인 ${evaluation.design}/10, 기능 ${evaluation.functionality}/10, 반응형 ${evaluation.responsiveness}/10, 코드 ${evaluation.codeQuality}/10 (평균 ${evaluation.average.toFixed(1)}) ✅`,
                  ts: nowTs(),
                }]);
              }
              break;
            }

            // Run improvement
            if (evaluation) {
              setStreamingText(`🔧 약점 보강 중... (${evaluation.improvements.slice(0, 2).join(", ")})`);
              const improvePrompt = buildImprovementPrompt(evaluation, evalCtx);
              const improveRes = await fetch("/api/ai/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  system: pipelineSystemMsg,
                  messages: [{ role: "user", content: improvePrompt }],
                  mode: "anthropic", model: "claude-sonnet-4-6", temperature,
                  maxTokens: 8192,
                }),
                signal: abortRef.current?.signal,
              });
              if (improveRes.ok) {
                const impReader = improveRes.body?.getReader();
                const impDec = new TextDecoder();
                let impAcc = "";
                if (impReader) {
                  while (true) {
                    const { done, value } = await impReader.read();
                    if (done) break;
                    for (const line of impDec.decode(value).split("\n")) {
                      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                        try { const { text } = JSON.parse(line.slice(6)); if (text) impAcc += text; } catch {}
                      }
                    }
                  }
                }
                const impParsed = parseAiResponse(impAcc);
                for (const [fname, content] of Object.entries(impParsed.fullFiles)) {
                  updated[fname] = { name: fname, language: extToLang(fname), content };
                }
                setFiles({ ...updated });
                autoDetectFramework(updated);
              }
              setAiMsgs(p => [...p, {
                role: "agent",
                text: `🔄 자체 평가 라운드 ${refineRound + 1}: 디자인 ${evaluation.design}/10, 기능 ${evaluation.functionality}/10 → 약점 보강 완료`,
                ts: nowTs(),
              }]);
            }
          } catch { break; }
          refineRound++;
        }

        // Final preview build
        setStreamingText("");
        dispatchAgent({ type: "PHASE_CHANGE", phase: "reviewing" });
        const changedFiles = Object.keys(updated).filter(f => f !== "README.md");
        setChangedFiles(changedFiles);
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => { const next = [...p]; for (const f of changedFiles) if (!next.includes(f)) next.push(f); return next; });
        setTimeout(() => {
          try {
            let html = buildPreview(updated);
            if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
            html = injectEnvVars(html, envRef.current);
            html = injectSupabaseCdn(html, envRef.current);
            setPreviewSrc(injectConsoleCapture(html));
            setIframeKey(Date.now());
          } catch (e) {
            console.error("[Pipeline] buildPreview failed:", e);
          }
          setHasRun(true); setLogs([]); setErrorCount(0);
        }, 100);

        // Force-save immediately after pipeline (don't rely on 1.5s debounce)
        try {
          const proj: Project = { id: projectId, name: projectName, files: updated, updatedAt: new Date().toISOString() };
          saveProjectToStorage(proj);
          localStorage.setItem(CUR_KEY, projectId);
        } catch { /* ignore */ }

        // Quality validation
        const fileContents: Record<string, string> = {};
        for (const [k, v] of Object.entries(updated)) fileContents[k] = v.content;
        const qReport = validateCommercialQuality(fileContents, pipeline.platformType);
        const qualityNote = qReport.passed
          ? `\n📊 품질 점수: ${qReport.score}/100 ✅`
          : `\n📊 품질 점수: ${qReport.score}/100 ⚠️\n${qReport.issues.filter(i => i.severity !== "info").map(i => `- ${i.message}`).join("\n")}`;

        const totalPhases = pipeline.steps.length + phasesToRun.length + refineRound;
        const fileList = changedFiles.map(f => `\`${f}\``).join(", ");
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `🏢 상용급 ${totalPhases}단계 자동 생성+개선 완료!\n✅ ${fileList} 생성됨${qualityNote}\n\n에러가 발생하면 자동으로 수정합니다.`,
          ts: nowTs(),
        }]);

        // If quality check failed with errors, auto-fix — FIX 8: limit to 2 attempts
        if (!qReport.passed && qReport.issues.some(i => i.severity === "error") && qualityFixAttempts.current < 2) {
          qualityFixAttempts.current++;
          const fixPrompt = buildQualityFixPrompt(qReport);
          if (fixPrompt) {
            setTimeout(() => runAI(fixPrompt), 1500);
          }
        }

        // ── #5 Auto-Improve Agent: background analysis after generation ─────
        // Reset autoFixAttempts so post-pipeline errors can still be auto-fixed
        autoFixAttempts.current = 0;
        setTimeout(() => autoTest(), 2200);
        setTimeout(async () => {
          try {
            const aiCtx = {
              html: updated["index.html"]?.content ?? "",
              css: updated["style.css"]?.content ?? "",
              js: updated["script.js"]?.content ?? "",
              consoleErrors: logs.filter(l => l.level === "error").map(l => l.msg),
              originalPrompt: prompt,
            };
            const analysisRes = await fetch("/api/ai/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system: "You are a code analysis agent. Output ONLY valid JSON.",
                messages: [{ role: "user", content: buildAnalysisPrompt(aiCtx) }],
                mode: pipelineMode, model: pipelineModelId, temperature: 0.3, maxTokens: 2048,
              }),
            });
            if (!analysisRes.ok) return;
            const anlReader = analysisRes.body?.getReader();
            const anlDec = new TextDecoder();
            let anlAcc = "";
            if (anlReader) {
              while (true) {
                const { done, value } = await anlReader.read();
                if (done) break;
                for (const line of anlDec.decode(value).split("\n")) {
                  if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                    try { const { text } = JSON.parse(line.slice(6)); if (text) anlAcc += text; } catch {}
                  }
                }
              }
            }
            const suggestions = parseAnalysisResponse(anlAcc);
            const autoFixes = getAutoApplySuggestions(suggestions);
            if (autoFixes.length > 0) {
              const fixPrompt2 = buildAutoFixPrompt(autoFixes, aiCtx);
              if (fixPrompt2) {
                setAiMsgs(p => [...p, { role: "agent", text: getAutoImproveLabel("fixing", autoFixes.length), ts: nowTs() }]);
                runAI(fixPrompt2);
              }
            } else if (suggestions.length > 0) {
              const suggList = suggestions.slice(0, 3).map(s => `- [${s.severity}] ${s.title}`).join("\n");
              setAiMsgs(p => [...p, { role: "agent", text: `💡 AI 분석 결과:\n${suggList}`, ts: nowTs() }]);
            }
          } catch { /* background analysis failed silently */ }
        }, 5000);
      } catch (err: unknown) {
        setStreamingText("");
        dispatchAgent({ type: "ERROR", message: (err as Error)?.message || "Pipeline error" });
        const refunded = getTokens() + cost;
        setTokenStore(refunded);
        setTokenBalance(refunded);
        fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: cost }) }).catch(() => {});
        if ((err as Error)?.name !== "AbortError") {
          const pipelineErrMsg = (err as Error)?.message?.slice(0, 100) ?? "연결 실패"; // FIX 17
          setAiMsgs(p => [...p, {
            role: "agent",
            text: `⚠️ 상용급 파이프라인 오류: ${pipelineErrMsg}\n토큰이 복구되었습니다. 일반 모드로 자동 재시도합니다...`,
            ts: nowTs(),
          }]);
          // Fallback: retry as single-shot normal generation
          dispatchAgent({ type: "RESET" });
          setAiLoading(false);
          aiLockRef.current = false;
          abortRef.current = null;
          setTimeout(() => runAI(prompt, false), 500);
          return;
        }
      }
      dispatchAgent({ type: "COMPLETE" });
      dispatchAgent({ type: "RESET" });
      setAiLoading(false);
      aiLockRef.current = false;
      abortRef.current = null;
      return;
    }

    try {
      abortRef.current = new AbortController();
      pushHistory("AI 생성 전");
      dispatchAgent({ type: "STREAM_BEGIN" });

      // Always send current files so AI can build on existing code (not restart from scratch)
      const hasRealFiles = Object.values(filesRef.current).some(
        f => f.content.length > 200 && !f.content.includes("Dalkak IDE")
      );

      const systemMsg = buildSystemPrompt({
        autonomyLevel,
        buildMode,
        customSystemPrompt,
        hasExistingFiles: hasRealFiles,
        modelId: selectedModelId,
        userPrompt: prompt,
      });

      // ── Context-managed history trimming ──────────────────────────────
      const systemTokens = estimateTokens(systemMsg);
      const modelMeta = getModelMeta(selectedModelId);
      const MODEL_CTX_WINDOW = modelMeta?.contextWindow ?? 128000;
      const budget = createBudget(MODEL_CTX_WINDOW, systemTokens, maxTokens || 4096);

      // Build file context with token budget awareness
      const fileCtxBudget = Math.min(
        Math.floor(budget.availableForHistory * 0.4),
        45000,
      );
      const fileCtx = hasRealFiles
        ? "\n\n## Current project files (READ CAREFULLY — build on these, preserve all existing features):\n" +
          buildFileContext(filesRef.current, activeFile, fileCtxBudget)
        : "";

      const rawHistMsgs = aiMsgs
        .filter(m => !m.image)
        .map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));

      // Trim history to fit remaining budget (after file context)
      const fileCtxTokens = estimateTokens(fileCtx);
      const historyBudget = createBudget(
        budget.availableForHistory - fileCtxTokens,
        0,
        0,
      );
      const trimmedHist = trimHistory(rawHistMsgs, historyBudget);
      // FIX 10: notify user if history was trimmed
      if (trimmedHist.length < rawHistMsgs.length) {
        showToast("💡 긴 대화를 압축했습니다 (이전 문맥 일부 생략)");
      }

      // ── Design Mode: if image is attached, build design-to-code prompt ──
      let finalPrompt = prompt + fileCtx;
      if (img) {
        const { buildDesignToCodePrompt } = await import("./ai/designMode");
        const designPrompt = buildDesignToCodePrompt({
          description: prompt,
          style: "modern",
          responsive: true,
          interactive: true,
        });
        finalPrompt = designPrompt + (fileCtx ? `\n\n${fileCtx}` : "");
      }

      const body: Record<string, unknown> = {
        system: systemMsg,
        messages: [...trimmedHist, { role: "user", content: finalPrompt }],
        mode: aiMode,
        model: selectedModelId,
        temperature,
        maxTokens,
      };
      if (img) {
        if (!canModelHandleVision(selectedModelId)) {
          showToast("이 모델은 이미지를 지원하지 않습니다");
          setAiLoading(false);
          aiLockRef.current = false;
          abortRef.current = null;
          dispatchAgent({ type: "RESET" });
          return;
        }
        body.image = img.base64;
        body.imageMime = img.mime;
      }

      // Timeout: abort if no response in 60s — FIX 2: use ref so it can be cleared on unmount
      if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
      abortTimeoutRef.current = setTimeout(() => abortRef.current?.abort(), 60_000);
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      if (abortTimeoutRef.current) { clearTimeout(abortTimeoutRef.current); abortTimeoutRef.current = null; }
      if (res.status === 402) {
        // Refund tokens on billing limit
        const refunded402 = getTokens() + cost;
        setTokenStore(refunded402);
        setTokenBalance(refunded402);
        fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: cost }) }).catch(() => {});
        const limitBody = await res.json().catch(() => ({}));
        // 결제 필요 (미결제 차단)
        if (limitBody.requiresPayment) {
          setAiMsgs(prev => [...prev, {
            role: "agent" as const,
            text: "💳 **결제 후 이용 가능합니다**\n\n첫 1회 무료 체험을 사용했습니다. 계속 사용하려면 요금제를 선택해주세요.\n\n[요금제 보기 →](/pricing)",
            ts: new Date().toISOString(),
          }]);
          setAiLoading(false);
          aiLockRef.current = false;
          abortRef.current = null;
          return;
        }
        if (limitBody.canTopUp) {
          setTopUpData({
            currentSpent: limitBody.currentSpent ?? 0,
            hardLimit:    limitBody.hardLimit    ?? 50000,
            periodReset:  limitBody.periodReset  ?? "",
          });
          setShowTopUp(true);
          setAiLoading(false);
          aiLockRef.current = false;
          abortRef.current = null;
          return;
        }
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = "";
      let firstChunk = true;
      // 스트리밍 중 완성된 FILE 블록 즉시 프리뷰 적용
      let streamApplied = 0;
      const liveUpdated = { ...filesRef.current };
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text } = JSON.parse(line.slice(6));
                if (text) {
                  if (firstChunk) { dispatchAgent({ type: "PHASE_CHANGE", phase: "coding" }); firstChunk = false; }
                  acc += text;
                  // Show current file/edit being written
                  const fileOpenMatches = acc.match(/\[FILE:([^\]]+)\]/g) ?? [];
                  const fileClosedCount = (acc.match(/\[\/FILE\]/g) ?? []).length;
                  const editOpenMatches = acc.match(/\[EDIT:([^\]]+)\]/g) ?? [];
                  const editClosedCount = (acc.match(/\[\/EDIT\]/g) ?? []).length;
                  const totalOpen = fileOpenMatches.length + editOpenMatches.length;
                  const totalClosed = fileClosedCount + editClosedCount;
                  const allOpenTags = [...fileOpenMatches, ...editOpenMatches];
                  const currentFile = totalOpen > totalClosed && allOpenTags.length > 0
                    ? allOpenTags[allOpenTags.length - 1].replace(/\[(FILE|EDIT):/, "").replace("]", "")
                    : null;
                  const isEditing = editOpenMatches.length > editClosedCount;
                  const display = acc
                    .replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, "")
                    .replace(/\[EDIT:[^\]]+\][\s\S]*?\[\/EDIT\]/g, "")
                    .trim();
                  setStreamingText(display || (currentFile
                    ? isEditing
                      ? `✏️ ${currentFile} 패치 중... (${totalClosed}개 완료)`
                      : `📝 ${currentFile} 작성 중... (${totalClosed}개 완료)`
                    : "⚙️ 코드 생성 중..."));

                  // ── 완성된 FILE 블록 즉시 프리뷰 적용 ─────────────────────
                  const allDone = acc.match(/\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g) ?? [];
                  if (allDone.length > streamApplied) {
                    for (let bi = streamApplied; bi < allDone.length; bi++) {
                      const bm = allDone[bi].match(/\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/);
                      if (bm) {
                        const fn = bm[1].trim(), fc = bm[2].trim();
                        liveUpdated[fn] = { name: fn, language: extToLang(fn), content: fc };
                      }
                    }
                    streamApplied = allDone.length;
                    // FIX 9: only update live preview if HTML looks structurally valid
                    try {
                      const livePreviewHtml = buildPreview(liveUpdated);
                      if (livePreviewHtml.includes('<html') && livePreviewHtml.includes('</html>')) {
                        let liveHtml = livePreviewHtml;
                        if (cdnRef.current.length > 0) liveHtml = injectCdns(liveHtml, cdnRef.current);
                        liveHtml = injectEnvVars(liveHtml, envRef.current);
                        liveHtml = injectSupabaseCdn(liveHtml, envRef.current);
                        setPreviewSrc(injectConsoleCapture(liveHtml));
                        setIframeKey(Date.now());
                        setHasRun(true);
                      }
                    } catch { /* skip invalid partial HTML */ }
                  }
                }
              } catch {}
            }
          }
        }
      }
      dispatchAgent({ type: "PHASE_CHANGE", phase: "reviewing" });

      setStreamingText("");
      // ── Diff-aware AI response parsing ──────────────────────────────────────
      const diffParsed = parseAiResponse(acc);
      // Fallback: also try legacy parseAiFiles for backward compat
      const legacyParsed = (diffParsed.type === "text-only") ? parseAiFiles(acc) : {};
      const hasCodeBlocks = diffParsed.type !== "text-only" || Object.keys(legacyParsed).length > 0;

      if (hasCodeBlocks) {
        const updated = { ...filesRef.current };
        const changed: string[] = [];

        // 1. Apply diff patches (EDIT blocks)
        const failedPatchFiles: string[] = [];
        if (diffParsed.type === "diff" || diffParsed.type === "mixed") {
          for (const diff of diffParsed.diffs) {
            const original = updated[diff.filename]?.content ?? "";
            const result = applyDiffPatch(original, diff.searchBlocks);
            if (result.success || result.appliedCount > 0) {
              updated[diff.filename] = {
                name: diff.filename,
                language: extToLang(diff.filename),
                content: result.content,
              };
              changed.push(diff.filename);
              if (result.failedCount > 0) {
                console.warn(
                  `[DiffPatch] ${diff.filename}: ${result.appliedCount} applied, ${result.failedCount} failed`,
                  result.failedSearches
                );
              }
            } else if (result.failedCount > 0) {
              // All patches failed — track for auto-retry with full rewrite
              console.warn(
                `[DiffPatch] ${diff.filename}: all ${result.failedCount} patches failed`,
                result.failedSearches
              );
              failedPatchFiles.push(diff.filename);
            }
          }
        }

        // 2. Apply full-file blocks (FILE blocks from diff parser)
        for (const [fname, content] of Object.entries(diffParsed.fullFiles)) {
          updated[fname] = { name: fname, language: extToLang(fname), content };
          if (!changed.includes(fname)) changed.push(fname);
        }

        // 3. Fallback: apply legacy parsed files (for pure fenced code blocks etc.)
        for (const [fname, content] of Object.entries(legacyParsed)) {
          if (!diffParsed.fullFiles[fname]) {
            updated[fname] = { name: fname, language: extToLang(fname), content };
            if (!changed.includes(fname)) changed.push(fname);
          }
        }

        // EDIT 패치 전체 실패 → 자동으로 전체 파일 재작성 요청 — FIX 12: retry if critical files failed
        const criticalFailed = failedPatchFiles.filter(f => ['index.html', 'script.js', 'style.css'].includes(f));
        if ((criticalFailed.length > 0 || (failedPatchFiles.length > 0 && changed.length === 0)) && autoFixAttempts.current < 2) {
          autoFixAttempts.current++;
          setAiMsgs(p => [...p, {
            role: "agent",
            text: `⚠️ ${failedPatchFiles.map(f => `\`${f}\``).join(", ")} 수정 패턴을 찾지 못했습니다. 전체 파일로 재작성합니다...`,
            ts: nowTs(),
          }]);
          setTimeout(() => {
            const rewritePrompt = `${failedPatchFiles.join(", ")} 파일을 전체 재작성해줘. 반드시 [FILE:파일명]...[/FILE] 형식으로 전체 코드를 출력해. 절대 중간에 자르지 마. 현재 요청: ${prompt}`;
            runAI(rewritePrompt);
          }, 600);
        }

        // AI가 index.html을 새로 생성했는데 script.js를 포함하지 않은 경우,
        // 이전 프로젝트의 stale JS를 비우고 자동 2차 요청 준비
        const allParsedFiles = { ...diffParsed.fullFiles, ...legacyParsed };
        const editedFilenames = diffParsed.diffs.map(d => d.filename);
        let needsAutoJS = false;
        if ((allParsedFiles["index.html"] || editedFilenames.includes("index.html")) &&
            !allParsedFiles["script.js"] && !editedFilenames.includes("script.js")) {
          const newHtml = updated["index.html"]?.content ?? "";
          // HTML에 canvas, 버튼, 인터랙션 요소가 있으면 JS가 반드시 필요
          const hasInteractive = /(<canvas|<button|onclick|addEventListener|getElementById|\.game|\.app)/i.test(newHtml);
          if (hasInteractive) {
            needsAutoJS = true;
            // stale JS 즉시 비우기 (에러 방지)
            updated["script.js"] = {
              name: "script.js", language: "javascript",
              content: "// ⏳ JavaScript 자동 생성 중...\ndocument.addEventListener('DOMContentLoaded', function() {});\n",
            };
            changed.push("script.js");
          }
        }
        // Dispatch diff apply event with modified files
        if (changed.length > 0) {
          dispatchAgent({ type: "DIFF_APPLY", files: changed });
        }
        // Feature 5: Diff stats — count changed lines and show toast
        const diffLineCount = Object.entries(updated).reduce((sum, [name, f]) => {
          const prev = filesRef.current?.[name]?.content ?? "";
          return sum + getChangedLineCount(prev, f.content);
        }, 0);
        if (diffLineCount > 0) {
          setAiMsgs(p => [...p, {
            role: "agent" as const,
            text: `✏️ ${diffLineCount}줄 변경됨`,
            ts: nowTs(),
          }]);
        }
        setFiles(updated);
        autoDetectFramework(updated);
        setChangedFiles(changed);
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => {
          const next = [...p];
          for (const fname of changed) if (!next.includes(fname)) next.push(fname);
          return next;
        });
        setHasRun(true); setLogs([]); setErrorCount(0);
        setTimeout(() => {
          try {
            let html = buildPreview(updated);
            if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
            html = injectEnvVars(html, envRef.current);
            html = injectSupabaseCdn(html, envRef.current);
            setPreviewSrc(injectConsoleCapture(html));
            setIframeKey(Date.now());
          } catch (err) {
            console.error('[AI] preview build failed:', err);
          }
        }, 100);
        // 코드 생성 완료 후 자동 테스트 실행 (프리뷰 로드 대기 후)
        setTimeout(() => autoTest(), 2200);

        // Detect truncated output on simple path and warn user
        const truncatedFiles = Object.entries(updated).filter(([fname, f]) => isFileTruncated(f.content, fname));
        if (truncatedFiles.length > 0) {
          const names = truncatedFiles.map(([f]) => f).join(", ");
          showToast(`⚠️ ${names} 코드가 잘렸습니다. "계속 작성해줘"라고 입력하세요`);
        }

        // ── Feature 3: Design-to-Code validation (only when image was attached) ──
        if (img) {
          const genHtml = updated["index.html"]?.content ?? "";
          const genCss = updated["style.css"]?.content ?? "";
          import("./ai/designMode").then(({ validateDesignOutput }) => {
            if (!validateDesignOutput(genHtml, genCss)) {
              showToast("⚠️ 디자인 변환이 불완전합니다. 재생성을 시도합니다.");
              setTimeout(() => runAI(prompt), 1200);
            }
          }).catch(() => {});
        }

        const fileList = changed.map(f => `\`${f}\``).join(", ");
        const diffInfo = diffParsed.diffs.length > 0
          ? ` (패치 ${diffParsed.diffs.reduce((n, d) => n + d.searchBlocks.length, 0)}개 적용)`
          : "";

        // ── Auto-complete: script.js가 누락되면 템플릿 fallback 적용 ──
        if (needsAutoJS) {
          // 원본 프롬프트에서 매칭되는 템플릿 검색 (fallback 모드)
          const tpl = matchTemplate(prompt, "fallback");
          if (tpl && tpl["script.js"]) {
            // 템플릿의 script.js를 즉시 적용 (AI 재요청 불필요)
            updated["script.js"] = { ...tpl["script.js"] };
            setFiles({ ...updated });
            autoDetectFramework(updated);
            templateAppliedAt.current = Date.now();
            autoFixAttempts.current = 0;
            // 프리뷰 즉시 갱신
            setTimeout(() => {
              let html = buildPreview(updated);
              if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
              html = injectEnvVars(html, envRef.current);
              html = injectSupabaseCdn(html, envRef.current);
              setPreviewSrc(injectConsoleCapture(html));
              setIframeKey(Date.now());
            }, 200);
            setAiMsgs(p => [...p, {
              role: "agent",
              text: `✅ ${fileList} 생성/수정 완료${diffInfo}.\n\n🎮 내장 템플릿으로 script.js를 자동 적용했습니다. 게임을 플레이해보세요!`,
              ts: nowTs(),
            }]);
          } else {
            // 템플릿 없으면 2차 AI 요청 시도
            setAiMsgs(p => [...p, {
              role: "agent",
              text: `✅ ${fileList} 생성/수정 완료${diffInfo}.\n\n⏳ script.js가 누락되어 자동으로 JavaScript를 생성합니다...`,
              ts: nowTs(),
            }]);
            const capturedHtml = updated["index.html"]?.content ?? "";
            const capturedCss = updated["style.css"]?.content ?? "";
            setTimeout(() => {
              const autoPrompt = `위 HTML과 CSS에 맞는 완전한 script.js를 생성해줘. HTML의 모든 버튼, canvas, 인터랙션이 실제로 동작하도록 전체 JavaScript 코드를 작성해. 코드가 길어도 절대 중간에 자르지 마. 반드시 [FILE:script.js]...[/FILE] 형식으로 출력해.\n\nindex.html:\n${capturedHtml.slice(0, 8000)}\n\nstyle.css:\n${capturedCss.slice(0, 3000)}`;
              runAI(autoPrompt);
            }, 1000);
          }
        } else {
          // 파일 절단 감지: 열린 괄호 > 닫힌 괄호 or 미완성 구조
          const truncatedFiles = changed.filter(f => isFileTruncated(updated[f]?.content ?? "", f));
          if (truncatedFiles.length > 0 && autoFixAttempts.current < 2) {
            autoFixAttempts.current++;
            setAiMsgs(p => [...p, {
              role: "agent",
              text: `⚠️ ${truncatedFiles.map(f => `\`${f}\``).join(", ")} 파일이 중간에 잘린 것 같습니다. 자동으로 완성 요청 중...`,
              ts: nowTs(),
            }]);
            setTimeout(() => {
              // "이어서" 방식은 중간부터 시작하는 JS를 만들어 SyntaxError 유발 → 처음부터 재생성
              const truncPrompt = `${truncatedFiles.join(", ")} 파일을 처음부터 완전히 다시 작성해주세요. 반드시 [FILE:파일명]...[/FILE] 형식으로 전체 파일을 출력하세요. 코드를 축약하거나 /* ... */로 생략하지 마세요. 절대 중간에 자르지 마세요.`;
              runAI(truncPrompt);
            }, 800);
          } else {
            setAiMsgs(p => [...p, {
              role: "agent",
              text: `✅ ${fileList} 생성/수정 완료${diffInfo}.\n\n에러가 발생하면 자동으로 수정합니다.`,
              ts: nowTs(),
            }]);
          }
        }
      } else {
        // AI 응답이 비어있을 때 → 템플릿 fallback 시도 (fallback 모드)
        const tpl = matchTemplate(prompt, "fallback");
        if (tpl) {
          const updated = { ...filesRef.current, ...tpl };
          setFiles(updated);
          setChangedFiles(Object.keys(tpl));
          setTimeout(() => setChangedFiles([]), 3000);
          setOpenTabs(p => { const next = [...p]; for (const f of Object.keys(tpl)) if (!next.includes(f)) next.push(f); return next; });
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
          }, 100);
          // 폴백 템플릿 적용 후 자동 테스트 실행
          setTimeout(() => autoTest(), 2200);
          setAiMsgs(p => [...p, {
            role: "agent",
            text: `🎮 AI 응답이 불완전하여 내장 템플릿을 적용했습니다. 게임을 플레이해보세요!\n\n에러가 발생하면 자동으로 수정합니다.`,
            ts: nowTs(),
          }]);
        } else {
          const clean = acc.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
          if (clean.includes("429") || clean.includes("insufficient_quota") || clean.includes("quota") || clean.includes("스타터 플랜") || clean.includes("한도")) {
            track("upgrade_modal_shown", {});
            setShowUpgradeModal(true);
          } else {
            setAiMsgs(p => [...p, { role: "agent", text: clean || "응답을 받지 못했습니다.", ts: nowTs() }]);
          }
        }
      }
    } catch (err: unknown) {
      setStreamingText("");
      dispatchAgent({ type: "ERROR", message: (err as Error)?.message || "Unknown error" });
      // Refund tokens on failure
      const refunded = getTokens() + cost;
      setTokenStore(refunded);
      setTokenBalance(refunded);
      fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: cost }) }).catch(() => {});
      // AI 에러 시에도 템플릿 fallback (fallback 모드)
      const tplFallback = matchTemplate(prompt, "fallback");
      if (tplFallback && (err as Error)?.name !== "AbortError") {
        const updated = { ...filesRef.current, ...tplFallback };
        setFiles(updated);
        setChangedFiles(Object.keys(tplFallback));
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => { const next = [...p]; for (const f of Object.keys(tplFallback)) if (!next.includes(f)) next.push(f); return next; });
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
        }, 100);
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 서비스 오류가 발생했지만, 🎮 내장 템플릿으로 게임을 생성했습니다!\n토큰이 복구되었습니다. (${tokToUSD(refunded)})\n\n게임을 플레이해보세요!`,
          ts: nowTs(),
        }]);
      } else if ((err as Error)?.name !== "AbortError") {
        // FIX 17: sanitize raw error message (truncate to prevent stack trace exposure)
        const userFriendlyError = (err as Error)?.message?.slice(0, 100) ?? "연결 실패";
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 오류: ${userFriendlyError}\n토큰이 복구되었습니다. (${tokToUSD(refunded)})\n\n🔑 /settings에서 API 키를 확인하거나, 아래 버튼으로 재시도해주세요.\n[RETRY:${prompt}]`,
          ts: nowTs(),
        }]);
      }
    }
    // Increment usage counter for dashboard widgets
    try {
      const prev = Number(localStorage.getItem("dalkak_usage_ai") ?? "0");
      localStorage.setItem("dalkak_usage_ai", String(prev + 1));
    } catch {}
    // Finalize agent state machine
    track("ai_generate_complete", { model: selectedModelId, pipeline: "legacy", duration: Math.round((Date.now() - aiStartTime) / 1000) });
    fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: aiInput.trim(), app_name: aiMsgs[0]?.text?.slice(0, 60), model_id: selectedModelId }) }).catch(() => {});
    dispatchAgent({ type: "COMPLETE" });
    dispatchAgent({ type: "RESET" });
    setAiLoading(false);
    aiLockRef.current = false;
    abortRef.current = null;
  };

  // ── Feature 1: AI Debug Agent ────────────────────────────────────────────
  const handleAiDebug = useCallback(async () => {
    const errorLogs = logs.filter(l => l.level === "error" || l.level === "warn");
    if (errorLogs.length === 0) return;

    const errorText = errorLogs.map(l => `[${l.level.toUpperCase()}] ${l.msg}`).join("\n");
    const codeContext = Object.entries(filesRef.current ?? {})
      .map(([name, f]) => `// ${name}\n${f.content.slice(0, 2000)}`)
      .join("\n\n---\n\n");

    const debugPrompt = `다음 JavaScript 에러를 분석하고 수정해주세요:\n\n## 에러:\n${errorText}\n\n## 현재 코드:\n${codeContext}\n\n에러를 수정한 완전한 파일들을 [FILE:filename]...[/FILE] 형식으로 출력해주세요.`;

    setAiMsgs(p => [...p, { role: "user", text: `🤖 AI 디버그 실행: ${errorLogs.length}개 에러 분석 중...`, ts: nowTs() }]);
    setLeftTab("ai");
    await runAI(debugPrompt);
  }, [logs, runAI]); // eslint-disable-line

  // ── Feature 2: AI Auto-Test ──────────────────────────────────────────────
  const handleAutoTest = useCallback(async () => {
    const curFiles = filesRef.current ?? {};
    const html = curFiles["index.html"]?.content ?? "";
    const css = curFiles["style.css"]?.content ?? "";
    const js = curFiles["script.js"]?.content ?? "";

    if (html.length < 200) {
      showToast("⚠️ 먼저 앱을 생성해주세요");
      return;
    }

    const testPrompt = `다음 웹앱 코드를 분석하여 버그, UX 문제, 누락된 기능을 찾아주세요:

## index.html
\`\`\`html
${html.slice(0, 3000)}
\`\`\`

## style.css (일부)
\`\`\`css
${css.slice(0, 1500)}
\`\`\`

## script.js (일부)
\`\`\`js
${js.slice(0, 2000)}
\`\`\`

다음 형식으로 응답해주세요:
1. 🐛 발견된 버그 목록 (심각도: 높음/중간/낮음)
2. ✅ 정상 동작 확인된 기능
3. 💡 개선 제안 (선택)
버그가 있으면 수정된 코드도 [FILE:filename]...[/FILE] 형식으로 포함해주세요.`;

    setAiMsgs(p => [...p, { role: "user", text: "🧪 AI 자동 테스트 실행 중...", ts: nowTs() }]);
    setLeftTab("ai");
    await runAI(testPrompt);
  }, [runAI, showToast]); // eslint-disable-line

  const cancelAutoFixCountdown = () => {
    if (autoFixTimerRef.current) {
      clearInterval(autoFixTimerRef.current);
      autoFixTimerRef.current = null;
    }
    setAutoFixCountdown(null);
  };

  const autoFixErrors = () => {
    const errorLogs = logs.filter(l => l.level === "error");
    const errs = errorLogs.map(l => l.msg).join("\n").slice(0, 2000);
    if (!errs.trim()) return;

    const isTruncation = /Unexpected end of input|Unexpected token/i.test(errs);
    setAiMsgs(p => [...p, {
      role: "agent",
      text: `🔧 에러 ${errorLogs.length}건 — 스마트 수정 중...`,
      ts: nowTs(),
    }]);

    // ── 스마트 에러 분석 ──────────────────────────────────────────────────────
    const undefMatch  = errs.match(/['"]?(\w+)['"]?\s+is not defined/);
    const nullPropMatch = errs.match(/Cannot read propert(?:y|ies) of null.*?'(\w+)'/);
    const VALID_EXT = /\.(html|css|js|json)$/i;
    const MAX_CHARS = 5500;

    let fixPrompt: string;

    if (isTruncation) {
      const html = filesRef.current["index.html"]?.content.slice(0, 3000) ?? "";
      const css  = filesRef.current["style.css"]?.content.slice(0, 2000) ?? "";
      fixPrompt = `script.js가 중간에 잘려 SyntaxError가 발생했습니다. script.js를 처음부터 완전히 다시 작성해줘. 절대 자르지 마. [FILE:script.js]...[/FILE]로 출력.\n\n에러:\n${errs}\n\nindex.html:\n${html}\n\nstyle.css:\n${css}`;

    } else if (undefMatch) {
      const fnName = undefMatch[1];
      const files = filesRef.current;
      const jsContent = files["script.js"]?.content ?? "";
      const htmlContent = files["index.html"]?.content.slice(0, 2000) ?? "";
      const isDefined = /function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=/.test(jsContent) && jsContent.includes(fnName);

      if (!isDefined) {
        fixPrompt = `에러: "${fnName} is not defined" — script.js에 이 함수/변수가 없습니다.\n최상위 스코프(TOP-LEVEL)에 ${fnName} 함수를 추가해줘. DOMContentLoaded 안에 넣지 말 것.\n\n현재 script.js:\n${jsContent.slice(0, MAX_CHARS)}\n\nHTML 참고:\n${htmlContent}\n\n[FILE:script.js]...[/FILE]로 전체 수정본 출력.`;
      } else {
        fixPrompt = `에러: "${fnName} is not defined" — 함수가 있지만 DOMContentLoaded 내부 등 잘못된 스코프에 있을 수 있습니다.\n규칙: onclick="" 핸들러에서 접근하려면 함수가 반드시 TOP-LEVEL 스코프에 있어야 합니다.\n\n현재 script.js:\n${jsContent.slice(0, MAX_CHARS)}\n\n[FILE:script.js]...[/FILE]로 수정본 출력. 다른 기능은 유지.`;
      }

    } else if (nullPropMatch) {
      const propName = nullPropMatch[1];
      const jsContent = filesRef.current["script.js"]?.content ?? "";
      fixPrompt = `에러: null의 '${propName}' 속성 접근 오류. getElementById가 null을 반환하고 있습니다.\n수정: null-check 추가 — const el = document.getElementById('...'); if(el) el.${propName}(...);\n\n현재 script.js:\n${jsContent.slice(0, MAX_CHARS)}\n\n[FILE:script.js]...[/FILE]로 수정본 출력.`;

    } else {
      const code = Object.entries(filesRef.current)
        .filter(([n]) => VALID_EXT.test(n))
        .map(([n, f]) => `[FILE:${n}]\n${f.content.length > MAX_CHARS ? f.content.slice(0, MAX_CHARS) + "\n/* ... */" : f.content}\n[/FILE]`)
        .join("\n\n");
      fixPrompt = `에러를 수정해주세요. 규칙:\n1. /* ... */ 또는 // ... 로 코드를 절대 생략하지 마세요\n2. [FILE:파일명]...[/FILE] 형식으로 수정된 파일 전체를 출력하세요\n3. 코드가 길면 불필요한 주석/애니메이션을 제거해서 짧게 만드세요\n4. 반드시 완전히 실행 가능한 코드만 출력하세요\n\n발생한 에러 (${errorLogs.length}건):\n${errs}\n\n현재 코드:\n${code}`;
    }

    runAI(fixPrompt);
    setLeftTab("ai");
  };

  const handleAiSend = () => {
    const t = aiInput.trim();
    if (!t || aiLoading) return;
    setAiInput("");
    autoFixAttempts.current = 0; // 사용자 직접 입력 시 자동수정 카운터 리셋
    qualityFixAttempts.current = 0; // FIX 8: reset quality fix counter on new user message
    runAI(t);
  };

  // Share
  const shareProject = () => {
    let html = injectEnvVars(buildPreview(files), envRef.current);
    html = injectSupabaseCdn(html, envRef.current);
    try {
      const bytes = new TextEncoder().encode(html);
      const binary = Array.from(bytes, b => String.fromCodePoint(b)).join("");
      const encoded = btoa(binary);
      const dataUrl = `data:text/html;base64,${encoded}`;
      navigator.clipboard.writeText(dataUrl)
        .then(() => showToast("🔗 링크 복사됨"))
        .catch(() => { const a = document.createElement("a"); a.href = dataUrl; a.download = `${projectName}.html`; a.click(); showToast("📦 다운로드됨"); });
    } catch {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      a.download = `${projectName}.html`; a.click();
      showToast("📦 다운로드됨");
    }
  };

  // Auto Test — automatically interact with preview elements
  const autoTest = useCallback(() => {
    const iframe = document.querySelector('iframe[title="앱 미리보기"]') as HTMLIFrameElement;
    if (!iframe) return;
    setAutoTesting(true);
    setToast("🎬 자동 테스트 실행 중...");
    setTimeout(() => setToast(""), 2400);
    setTimeout(() => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) { setAutoTesting(false); return; }
        const all = Array.from(
          doc.querySelectorAll('button, input:not([type=hidden]), select, textarea, a[href], [role=button], [onclick]')
        ).filter(el => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).slice(0, 10);
        if (all.length === 0) {
          setAutoTesting(false);
          setToast("ℹ️ 인터랙션 요소 없음");
          setTimeout(() => setToast(""), 2400);
          return;
        }
        let t = 0;
        all.forEach((el, i) => {
          setTimeout(() => {
            try {
              const h = el as HTMLElement;
              h.scrollIntoView({ behavior: "smooth", block: "center" });
              const prev = h.style.outline;
              h.style.outline = "2px solid #f97316";
              setTimeout(() => { h.style.outline = prev; }, 500);
              if (el.tagName === "INPUT") {
                const inp = el as HTMLInputElement;
                if (inp.type === "time") { inp.value = "09:30"; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); }
                else if (inp.type === "text" || inp.type === "search" || inp.type === "email") { inp.value = "테스트"; inp.dispatchEvent(new Event("input", { bubbles: true })); }
                else if (inp.type === "number") { inp.value = "42"; inp.dispatchEvent(new Event("input", { bubbles: true })); }
                else if (inp.type === "range") { inp.value = String((Number(inp.max) + Number(inp.min)) / 2); inp.dispatchEvent(new Event("input", { bubbles: true })); }
                else if (inp.type === "checkbox" || inp.type === "radio") { inp.click(); }
                else { inp.click(); }
              } else if (el.tagName === "SELECT") {
                const s = el as HTMLSelectElement;
                if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event("change", { bubbles: true })); }
              } else {
                h.click();
              }
              if (i === all.length - 1) {
                setTimeout(() => {
                  setAutoTesting(false);
                  setToast("✅ 자동 테스트 완료");
                  setTimeout(() => setToast(""), 2400);
                }, 600);
              }
            } catch { /* ignore individual element errors */ }
          }, t);
          t += 700;
        });
      } catch { setAutoTesting(false); }
    }, 300);
  }, []); // eslint-disable-line

  // Agent Team — lazy init + reshuffle
  const initTeam = useCallback(async () => {
    const { LAB_AGENTS } = await import("@/lib/lab-agents");
    const fields = [...new Set(LAB_AGENTS.map(a => a.field))];
    const shuffled = fields.sort(() => Math.random() - 0.5).slice(0, 3);
    const picked = shuffled.map(field => {
      const fa = LAB_AGENTS.filter(a => a.field === field);
      return fa[Math.floor(Math.random() * fa.length)];
    });
    setTeamAgents(picked);
    return picked;
  }, []); // eslint-disable-line

  const toggleTeamPanel = useCallback(async () => {
    if (showTeamPanel) { setShowTeamPanel(false); return; }
    if (teamAgents.length === 0) await initTeam();
    setShowTeamPanel(true);
  }, [showTeamPanel, teamAgents.length, initTeam]); // eslint-disable-line

  const reshuffleTeam = useCallback(async () => {
    await initTeam();
    showToast("🔀 새 팀이 편성되었습니다");
  }, [initTeam]); // eslint-disable-line

  const activateTeam = useCallback((prompt: string) => {
    const teamPrompt = buildTeamPrompt({
      agents: teamAgents,
      userPrompt: prompt,
      existingFileNames: Object.keys(filesRef.current),
    });
    runAI(teamPrompt);
  }, [teamAgents]); // eslint-disable-line

  // Publish — real /p/[slug] URL via server
  const publishProject = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      let publishHtml = injectEnvVars(buildPreview(filesRef.current), envRef.current);
      publishHtml = injectSupabaseCdn(publishHtml, envRef.current);
      const html = injectConsoleCapture(publishHtml);

      // 1. Try logged-in publish (full ownership, permanent URL)
      const res = await fetch("/api/projects/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: projectName, html }),
      });
      if (res.ok) {
        const { url } = await res.json();
        setPublishedUrl(url);
        setShowPublishModal(true);
        await navigator.clipboard.writeText(url).catch(() => {});
        showToast("🚀 배포 완료 · URL 복사됨");
        track("app_published", { slug: url.split("/").pop() ?? "" });
        setPublishing(false);
        return;
      }

      // 2. Fallback: anonymous publish (no login required, clean short URL)
      const anonRes = await fetch("/api/projects/publish-anon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, html }),
      });
      if (anonRes.ok) {
        const { url } = await anonRes.json();
        setPublishedUrl(url + "?anon=1");
        setShowPublishModal(true);
        await navigator.clipboard.writeText(url).catch(() => {});
        showToast("🚀 배포 완료 · URL 복사됨 (로그인하면 영구 URL 발급)");
        setPublishing(false);
        return;
      }

      // 3. Last resort: compressed data URL (offline)
      const compressed = await compressHtml(html);
      const fallbackUrl = `${window.location.origin}/p#${encodeURIComponent(projectName)}:${compressed}`;
      setPublishedUrl(fallbackUrl);
      setShowPublishModal(true);
      await navigator.clipboard.writeText(fallbackUrl).catch(() => {});
      showToast("🚀 배포 완료 (오프라인 모드)");
    } catch { showToast("배포 실패 — 브라우저를 확인해주세요"); }
    setPublishing(false);
  }, [projectId, projectName, publishing]); // eslint-disable-line

  // Project ops
  const loadProject = (proj: Project) => {
    const doLoad = (p: Project) => {
      setFiles(p.files);
      setProjectName(p.name);
      setProjectId(p.id);
      setOpenTabs(Object.keys(p.files).slice(0, 5));
      try { localStorage.setItem(CUR_KEY, p.id); } catch { /* ignore */ }
      setShowProjects(false);
      setHistory([]);
      // 프로젝트 전환 시 AI 히스토리 초기화 — 이전 프로젝트 맥락 혼재 방지
      setAiMsgs([{ role: "agent", text: `📂 **${p.name}** 프로젝트를 열었습니다.\n\n무엇을 만들어드릴까요?`, ts: nowTs() }]);
      showToast(`📂 ${p.name} 로드됨`);
      setTimeout(runProject, 300);
    };

    // If files is empty (server stub), fetch full project from server
    if (Object.keys(proj.files).length === 0) {
      showToast("⏳ 서버에서 프로젝트 로드 중...");
      fetch(`/api/projects/${proj.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.project) {
            const full: Project = { id: d.project.id, name: d.project.name, files: d.project.files ?? DEFAULT_FILES, updatedAt: d.project.updated_at };
            saveProjectToStorage(full);
            doLoad(full);
          } else {
            showToast("⚠️ 프로젝트를 찾을 수 없습니다");
          }
        })
        .catch(() => showToast("⚠️ 서버 연결 실패"));
    } else {
      doLoad(proj);
    }
  };
  // Apply code from AI panel to a file
  const handleApplyCode = useCallback((code: string, filename: string) => {
    setFiles(prev => {
      const existing = prev[filename];
      const lang = existing?.language ?? (filename.endsWith(".css") ? "css" : filename.endsWith(".js") ? "javascript" : filename.endsWith(".ts") ? "typescript" : filename.endsWith(".py") ? "python" : "html");
      return { ...prev, [filename]: { name: filename, language: lang, content: code } };
    });
    setActiveFile(filename);
    if (!openTabs.includes(filename)) setOpenTabs(prev => [...prev.slice(-4), filename]); // max 5 tabs
  }, [openTabs]); // eslint-disable-line

  // Compare handler — open ModelComparePanel
  const handleCompare = useCallback((prompt: string) => {
    setComparePrompt(prompt);
    setShowCompare(true);
  }, []); // eslint-disable-line

  // Apply chosen compare result to workspace files
  const handleCompareApply = useCallback((text: string) => {
    const parsed = parseAiFiles(text);
    if (Object.keys(parsed).length > 0) {
      pushHistory("비교 적용 전");
      setFiles(prev => {
        const updated = { ...prev };
        for (const [fname, content] of Object.entries(parsed)) {
          const existing = updated[fname];
          const lang = existing?.language ?? extToLang(fname);
          updated[fname] = { name: fname, language: lang, content };
        }
        return updated;
      });
      setChangedFiles(Object.keys(parsed));
      setTimeout(() => setChangedFiles([]), 3000);
      setOpenTabs(prev => {
        const next = [...prev];
        for (const f of Object.keys(parsed)) if (!next.includes(f)) next.push(f);
        return next;
      });
      showToast("✅ 비교 결과 적용됨");
    } else {
      showToast("⚠️ 적용할 코드를 찾을 수 없습니다");
    }
    setShowCompare(false);
  }, []); // eslint-disable-line

  // A/B Test — run the same prompt twice with two different models and show side-by-side
  const handleAbTest = useCallback(async () => {
    const prompt = aiInput.trim();
    if (!prompt || aiLoading) return;

    const modelA = selectedModelId;
    const modelAMeta = AI_MODELS.find(m => m.id === modelA);
    const modelALabel = modelAMeta?.label ?? modelA;

    const modelBId = "claude-sonnet-4-6";
    const modelBLabel = "Claude Sonnet 4.6";

    setAbVersionA({ id: 'A', files: {}, status: 'generating', modelLabel: modelALabel });
    setAbVersionB({ id: 'B', files: {}, status: 'generating', modelLabel: modelBLabel });
    setShowAbTest(true);

    const systemMsg = buildSystemPrompt({
      autonomyLevel: autonomyLevel as "auto" | "max" | "conservative",
      buildMode: buildMode as "full" | "patch",
      customSystemPrompt,
      hasExistingFiles: false,
      modelId: modelA,
      userPrompt: prompt,
    });

    const body = (modelId: string) => JSON.stringify({
      system: systemMsg,
      messages: [{ role: "user", content: prompt }],
      mode: "auto",
      model: modelId,
      temperature,
      maxTokens: 4096,
    });

    const streamVersion = async (modelId: string, setter: typeof setAbVersionA, label: 'A' | 'B') => {
      try {
        const res = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body(modelId),
        });
        if (!res.ok) {
          setter(prev => ({ ...prev, status: 'error' }));
          return;
        }
        const reader = res.body?.getReader();
        const dec = new TextDecoder();
        let acc = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const chunk = JSON.parse(line.slice(6));
                  if (chunk.text) acc += chunk.text;
                } catch { /* ignore parse errors */ }
              }
            }
          }
        }
        const parsed = parseAiResponse(acc);
        setter(prev => ({
          ...prev,
          files: parsed.fullFiles,
          status: Object.keys(parsed.fullFiles).length > 0 ? 'done' : 'error',
        }));
      } catch {
        setter(prev => ({ ...prev, status: 'error' }));
      }
    };

    // Run both versions in parallel
    void streamVersion(modelA, setAbVersionA, 'A');
    void streamVersion(modelBId, setAbVersionB, 'B');
  }, [aiInput, aiLoading, selectedModelId, autonomyLevel, buildMode, customSystemPrompt, temperature]); // eslint-disable-line

  // Apply the winning A/B version to workspace files
  const handleAbTestSelect = useCallback((winner: 'A' | 'B') => {
    const winnerVersion = winner === 'A' ? abVersionA : abVersionB;
    const parsed = winnerVersion.files;
    if (Object.keys(parsed).length > 0) {
      pushHistory("A/B 테스트 적용 전");
      setFiles(prev => {
        const updated = { ...prev };
        for (const [fname, content] of Object.entries(parsed)) {
          const existing = updated[fname];
          const lang = existing?.language ?? extToLang(fname);
          updated[fname] = { name: fname, language: lang, content };
        }
        return updated;
      });
      setChangedFiles(Object.keys(parsed));
      setTimeout(() => setChangedFiles([]), 3000);
      setOpenTabs(prev => {
        const next = [...prev];
        for (const f of Object.keys(parsed)) if (!next.includes(f)) next.push(f);
        return next;
      });
      showToast(`✅ 버전 ${winner} 적용됨`);
    }
  }, [abVersionA, abVersionB]); // eslint-disable-line

  // Keyboard shortcuts (existing handler for Escape + Ctrl+Z/K)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // FIX 15: skip shortcuts when an input/textarea is focused (except allowed Ctrl combos)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      // Let Ctrl+Z be handled natively by inputs
      if (isInput && e.key === 'z' && (e.ctrlKey || e.metaKey)) return;
      if (isInput && !e.ctrlKey && !e.metaKey && e.key === 'Escape') return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); setLeftTab("search"); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); revertHistory(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowCommandPalette(p => !p); }
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") { e.preventDefault(); toggleSplit(); }
      // Ctrl+` — toggle terminal panel
      if ((e.ctrlKey || e.metaKey) && e.key === "`") { e.preventDefault(); setBottomTab("terminal"); setShowConsole(!showConsole || bottomTab !== "terminal"); return; }
      if (e.key === "Escape") { setCtxMenu(null); setShowNewFile(false); setIsFullPreview(false); setShowCdnModal(false); setShowEnvPanel(false); setShowProjects(false); setShowCommandPalette(false); setShowShortcuts(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [revertHistory, toggleSplit, showConsole, bottomTab]); // eslint-disable-line

  // ── Global Ctrl+V paste → image attach (screenshot→code) ──
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Skip if a text input/textarea is focused (let native paste work)
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const img = items.find(i => i.type.startsWith("image/"));
      if (!img) return;
      const f = img.getAsFile();
      if (!f) return;
      e.preventDefault();
      handleImageFile(f);
      setLeftTab("ai");
      showToast("📸 스크린샷 첨부됨 — AI에게 설명을 입력하고 전송하세요");
      setTimeout(() => {
        const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]');
        if (ta) ta.focus();
      }, 100);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []); // eslint-disable-line

  // Additional keyboard shortcuts via hook
  useKeyboardShortcuts({
    "ctrl+enter": () => runProject(),
    "ctrl+s": () => showToast("파일 저장됨"),
    "ctrl+shift+p": () => setShowCommandPalette(p => !p),
    "ctrl+/": () => setShowShortcuts(p => !p),
    "ctrl+b": () => setLeftW(w => w > 0 ? 0 : 265),
    "ctrl+j": () => { setLeftTab("ai"); setTimeout(() => { const el = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]'); el?.focus(); }, 50); },
  });

  // Focus trap for context menu
  const ctxMenuRef = useFocusTrap(ctxMenu !== null);

  const previewPx = deviceFrame ? deviceFrame.width : (previewWidth === "375" ? 375 : previewWidth === "768" ? 768 : previewWidth === "1280" ? 1280 : undefined);
  const previewHeightPx = deviceFrame ? deviceFrame.height : undefined;

  // ── MOBILE WORKSPACE MODE (simplified 2-tab layout) ───────────────────────────
  if (isMobile) {
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
            <AiChatPanel
              handleAiSend={handleAiSend}
              handleDrop={handleDrop}
              handlePaste={handlePaste}
              handleImageFile={handleImageFile}
              toggleVoice={toggleVoice}
              runAI={runAI}
              aiEndRef={aiEndRef}
              fileInputRef={fileInputRef}
              abortRef={abortRef}
              filesRef={filesRef}
              router={router}
              onApplyCode={handleApplyCode}
              onShowTemplates={() => setShowTemplates(true)}
              onCompare={handleCompare}
              onPublish={publishProject}
              onOpenGitHub={() => setShowGitHubPanel(true)}
              onVercelDeploy={handleVercelDeploy}
            />
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

  // ── RENDER ─────────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => { setCtxMenu(null); setShowProjects(false); }}
      onDragEnter={handleGlobalDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: T.bg, color: T.text,
        fontFamily: '"Pretendard","Inter",-apple-system,sans-serif',
        overflow: "hidden",
        cursor: draggingLeft || draggingRight || draggingConsole ? "col-resize" : "default",
        userSelect: draggingLeft || draggingRight || draggingConsole ? "none" : "auto",
      }}
    >
      {/* ── Screenshot→Code drop overlay ─────────────────────────────── */}
      {isDraggingImage && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(124,58,237,0.18)",
          backdropFilter: "blur(2px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: "3px dashed #a855f7",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📸</div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: "#fff",
            textShadow: "0 2px 16px rgba(124,58,237,0.8)",
            letterSpacing: "-0.5px",
          }}>이미지를 놓아 UI 클론 시작</div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
            스크린샷 → AI 분석 → 코드 자동 생성
          </div>
        </div>
      )}

      {/* ══ TOP BAR ════════════════════════════════════════════════════════════ */}
      <WorkspaceTopBar
        router={router}
        nameRef={nameRef}
        runProject={runProject}
        publishProject={publishProject}
        shareProject={shareProject}
        loadProject={loadProject}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ─── 스크린리더용 AI 로딩 상태 알림 ─────────────────────────────── */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {aiLoading ? "AI가 응답을 생성하고 있습니다..." : ""}
      </div>

      {/* ══ MOBILE TAB BAR (3-panel: files | ai | preview) ═══════════════ */}
      {isMobile && (
        <div role="tablist" aria-label="모바일 패널 선택" style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.topbar, zIndex: 20, padding: "0 8px", gap: 4 }}>
          {([["files", "\uD83D\uDCC1 파일"], ["ai", "\u2726 AI 코드"], ["preview", "\u25B6 미리보기"]] as [("files" | "ai" | "preview"), string][]).map(([panel, label]) => (
            <button key={panel} role="tab" aria-selected={mobilePanelExt === panel} onClick={() => setMobilePanelAll(panel)}
              style={{
                flex: 1, padding: "14px 4px", fontSize: 14, fontWeight: 700,
                minHeight: 48, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: mobilePanelExt === panel ? `${T.accent}18` : "transparent",
                color: mobilePanelExt === panel ? T.accent : T.muted,
                borderRadius: "8px 8px 0 0",
                transition: "all 0.15s",
                borderBottom: mobilePanelExt === panel ? `2px solid ${T.accent}` : "2px solid transparent",
              }}>{label}</button>
          ))}
        </div>
      )}

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }} {...(isMobile ? swipeHandlers : {})}>

        {/* ── ACTIVITY BAR (에디터 모드에서만 표시) ────────────────────────── */}
        {!isMobile && showEditor && (
          <ActivityBar
            router={router}
            onToggleCollab={toggleCollabPanel}
            onToggleGitHub={() => setShowGitHubPanel(p => !p)}
            onToggleDatabase={() => setShowDatabasePanel(p => !p)}
            onTogglePerformance={() => setShowPerformancePanel(p => !p)}
            onToggleSecrets={() => setShowSecretsPanel(p => !p)}
            onToggleTemplates={() => setShowTemplatesPanel(p => !p)}
            onTogglePlugins={() => setShowPluginManager(p => !p)}
            onToggleTeam={() => setShowTeamManagement(p => !p)}
            onToggleVisualBuilder={() => setShowVisualBuilder(p => !p)}
            onToggleGitGraph={() => setShowGitGraph(p => !p)}
            onVersionHistory={() => setShowVersionHistory(!showVersionHistory)}
            onShareLink={handleShareLink}
            showGitHub={showGitHubPanel}
            showDatabase={showDatabasePanel}
            showPerformance={showPerformancePanel}
            showSecrets={showSecretsPanel}
            showTemplates={showTemplatesPanel}
            showPlugins={showPluginManager}
            showTeam={showTeamManagement}
            showVisualBuilder={showVisualBuilder}
            showGitGraph={showGitGraph}
          />
        )}

        {/* ── LEFT PANEL (Claude-style AI Chat) ──────────────────────────── */}
        <div style={{
          flex: showEditor ? undefined : 45,
          width: showEditor ? (isMobile ? "100%" : leftW) : undefined,
          minWidth: showEditor ? undefined : 320,
          flexShrink: 0, display: "flex", flexDirection: "column",
          background: T.panel, borderRight: `1px solid ${T.border}`, overflow: "hidden",
          position: "relative",
          transition: "flex 0.3s ease, width 0.3s ease",
          ...(isMobile && mobilePanelExt !== "ai" && mobilePanelExt !== "files" ? { display: "none" } : {}),
        }}>
          {/* ── Mobile Files Panel ── */}
          {isMobile && mobilePanelExt === "files" && (
            <div style={{ flex: 1, overflow: "auto", background: T.panel }}>
              <WorkspaceFileTree newFileRef={newFileRef} />
            </div>
          )}
          {/* ── Chat Header (polished design) — hidden on mobile files panel ── */}
          {!showEditor && !(isMobile && mobilePanelExt === "files") && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 20px", borderBottom: `1px solid ${T.border}`,
              background: `linear-gradient(180deg, ${T.topbar} 0%, ${T.panel} 100%)`,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: "#fff", fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                }}>F9</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>딸깍 AI</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>코드 생성 · 실시간 프리뷰</div>
                </div>
              </div>
              <button
                onClick={() => setShowEditor(true)}
                title="코드 에디터 표시"
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: "transparent",
                  color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                  fontWeight: 600,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = "rgba(249,115,22,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "transparent"; }}
              >
                &lt;&gt; 코드
              </button>
            </div>
          )}

          {/* ── Editor mode: show tabs ── */}
          {showEditor && (
            <div role="tablist" aria-label="왼쪽 패널 탭" style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.topbar }}>
              {([["files", "📁 파일"], ["search", "🔍 검색"], ["ai", "✦ AI"]] as [LeftTab, string][]).map(([tab, label]) => (
                <button key={tab} role="tab" aria-selected={leftTab === tab} onClick={() => setLeftTab(tab)}
                  style={{
                    flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 600,
                    border: "none", cursor: "pointer", fontFamily: "inherit", background: "transparent",
                    color: leftTab === tab ? T.accent : T.muted,
                    borderBottom: leftTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
                    transition: "all 0.12s",
                  }}>{label}</button>
              ))}
              <button onClick={() => setShowEditor(false)} title="에디터 숨기기"
                style={{
                  padding: "0 10px", border: "none", cursor: "pointer",
                  background: "transparent", color: T.muted, fontSize: 12, fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = T.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >&times;</button>
            </div>
          )}

          {/* File list / Search / AI Chat */}
          {showEditor && leftTab === "files" ? (
            <WorkspaceFileTree
              newFileRef={newFileRef}
            />
          ) : showEditor && leftTab === "search" ? (
            <FileSearchPanel
              files={files}
              onOpenFile={openFile}
              onGoToLine={(filename, _line) => { openFile(filename); }}
            />
          ) : showEditor && leftTab === "git" ? (
            <GitPanel />
          ) : showEditor && leftTab === "packages" ? (
            <PackagePanel />
          ) : !(isMobile && mobilePanelExt === "files") ? (
            /* ── AI Chat (always visible when editor hidden, except mobile files panel) ── */
            <AiChatPanel
              handleAiSend={handleAiSend}
              handleDrop={handleDrop}
              handlePaste={handlePaste}
              handleImageFile={handleImageFile}
              toggleVoice={toggleVoice}
              runAI={runAI}
              aiEndRef={aiEndRef}
              fileInputRef={fileInputRef}
              abortRef={abortRef}
              filesRef={filesRef}
              router={router}
              onApplyCode={handleApplyCode}
              onShowTemplates={() => setShowTemplates(true)}
              onCompare={handleCompare}
              onPublish={publishProject}
              onOpenGitHub={() => setShowGitHubPanel(true)}
              onVercelDeploy={handleVercelDeploy}
            />
          ) : null}

          {/* Drag handle (only in editor mode) — mouse + touch */}
          {showEditor && (
            <div onMouseDown={startDragLeft} onTouchStart={touchDragLeft}
              style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "col-resize", zIndex: 10, background: draggingLeft ? T.borderHi : "transparent", touchAction: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.border)}
              onMouseLeave={e => { if (!draggingLeft) e.currentTarget.style.background = "transparent"; }}
            />
          )}
        </div>

        {/* ── CENTER: Editor + Console (숨김 가능) ──────────────────────── */}
        <div style={{ display: showEditor ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden", transition: "flex 0.3s ease" }}>
          <WorkspaceEditorPane
            autoFixTimerRef={autoFixTimerRef}
            autoFixErrors={autoFixErrors}
            runAI={runAI}
            startDragConsole={startDragConsole}
            onToggleSplit={toggleSplit}
            onSplitFileChange={handleSplitFileChange}
            onRunProject={runProject}
          />
        </div>

        {/* Drag handle right (에디터 모드에서만) */}
        {showEditor && <DragHandle direction="horizontal" onMouseDown={startDragRight} isDragging={draggingRight} />}

        {/* ── RIGHT: Preview (Replit-style) ──────────────────────────── */}
        <div aria-label="미리보기" style={{
          flex: showEditor ? undefined : 55,
          width: showEditor ? (isMobile ? "100%" : rightW) : undefined,
          minWidth: showEditor ? undefined : 360,
          flexShrink: 0, display: isMobile && mobilePanelExt !== "preview" ? "none" : "flex", flexDirection: "column",
          background: T.panel, overflow: "hidden",
          transition: "flex 0.3s ease, width 0.3s ease",
          ...(isFullPreview ? { position: "fixed", inset: 0, zIndex: 50, width: "100%", height: "100%" } : {}),
        }}>
          {/* Preview header */}
          <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <PreviewHeaderToolbar
                runProject={runProject}
                autoTest={autoTest}
                onDeviceChange={setDeviceFrame}
              />
              <button
                onClick={() => setSandpackMode(p => !p)}
                style={{
                  padding: "3px 8px", fontSize: 11, border: "1px solid #e5e7eb",
                  borderRadius: 4, background: sandpackMode ? "#f97316" : "#fff",
                  color: sandpackMode ? "#fff" : "#6b7280", cursor: "pointer",
                  fontFamily: "inherit", marginLeft: 4,
                }}
                title={sandpackMode ? "Sandpack 끄기 (일반 미리보기로 전환)" : "Sandpack 켜기 (React/npm 지원)"}
              >
                {sandpackMode ? "⚛ React ON" : "⚛ React"}
              </button>
            </div>
            {/* Feature 2: AI Auto-Test button — visible when app has been generated */}
            {hasRun && !isMobile && (
              <button
                onClick={handleAutoTest}
                disabled={aiLoading}
                title="AI가 코드를 분석하여 버그와 UX 문제를 찾아줍니다"
                style={{
                  padding: "0 10px", height: 36, borderRadius: 0,
                  border: "none", borderLeft: `1px solid ${T.border}`,
                  background: "transparent",
                  color: aiLoading ? T.muted : T.accent,
                  cursor: aiLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                  flexShrink: 0, opacity: aiLoading ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; } }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                🧪 테스트
              </button>
            )}
            {/* A/B Test button — visible when there is a prompt to test */}
            {!isMobile && (
              <button
                onClick={handleAbTest}
                disabled={aiLoading || !aiInput.trim()}
                title="같은 프롬프트를 두 모델로 동시 실행하여 결과를 비교합니다"
                style={{
                  padding: "0 10px", height: 36, borderRadius: 0,
                  border: "none", borderLeft: `1px solid ${T.border}`,
                  background: "transparent",
                  color: (aiLoading || !aiInput.trim()) ? T.muted : "#0891b2",
                  cursor: (aiLoading || !aiInput.trim()) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                  flexShrink: 0, opacity: (aiLoading || !aiInput.trim()) ? 0.5 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!aiLoading && aiInput.trim()) { e.currentTarget.style.background = "rgba(8,145,178,0.08)"; } }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                ⚡ A/B
              </button>
            )}
            {/* History button */}
            {!isMobile && (
              <button
                onClick={() => setShowHistory(p => !p)}
                title="이전 생성 프롬프트 재사용"
                style={{
                  padding: "0 10px", height: 36, borderRadius: 0,
                  border: "none", borderLeft: `1px solid ${T.border}`,
                  background: showHistory ? "rgba(129,140,248,0.12)" : "transparent",
                  color: showHistory ? "#818cf8" : "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                📜 히스토리
              </button>
            )}
            {/* Explain button — visible when app has been generated */}
            {hasRun && !isMobile && (
              <button
                onClick={() => { setShowExplain(p => { if (!p) track("explain_opened", {}); return !p; }); }}
                title="AI가 이 앱의 코드를 한국어로 설명해줍니다"
                style={{
                  padding: "0 10px", height: 36, borderRadius: 0,
                  border: "none", borderLeft: `1px solid ${T.border}`,
                  background: showExplain ? "rgba(249,115,22,0.12)" : "transparent",
                  color: showExplain ? "#f97316" : "#ea580c",
                  cursor: "pointer",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!showExplain) e.currentTarget.style.background = "rgba(249,115,22,0.08)"; }}
                onMouseLeave={e => { if (!showExplain) e.currentTarget.style.background = "transparent"; }}
              >
                🔍 설명
              </button>
            )}
          </div>

          {/* Iframe container — single or multi-preview */}
          {multiPreview ? (
            /* ── Multi-preview: 3 devices side-by-side ── */
            <div style={{
              flex: 1, overflowX: "auto", overflowY: "auto", background: "#111118",
              display: "flex", flexWrap: "nowrap", justifyContent: "flex-start", alignItems: "flex-start",
              gap: 16, padding: 16,
            }}>
              {([
                { label: "Mobile", width: 375, height: 667 },
                { label: "Tablet", width: 768, height: 1024 },
                { label: "Desktop", width: 1280, height: 800 },
              ]).map(dev => (
                <div key={dev.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600 }}>{dev.label} ({dev.width}px)</span>
                  <div style={{
                    width: Math.min(dev.width, 400), height: Math.min(dev.height, 500),
                    background: "#fff", borderRadius: 8, overflow: "hidden",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                    border: "1px solid #30363d",
                  }}>
                    <iframe
                      key={`${iframeKey}-${dev.label}`}
                      srcDoc={previewSrc}
                      sandbox="allow-scripts allow-forms allow-modals allow-popups"
                      referrerPolicy="no-referrer"
                      style={{
                        width: dev.width, height: dev.height, border: "none", display: "block",
                        transform: `scale(${Math.min(400 / dev.width, 500 / dev.height)})`,
                        transformOrigin: "0 0",
                      }}
                      title={`${dev.label} 미리보기`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Single preview ── */
            <div style={{
              flex: 1, overflow: "auto",
              background: previewWidth !== "full" ? "#111118" : "#fff",
              display: "flex", justifyContent: "center", alignItems: previewWidth !== "full" ? "flex-start" : "stretch",
            }}>
              <div style={{
                width: previewPx ?? "100%",
                minHeight: "100%",
                background: "#fff",
                boxShadow: previewWidth !== "full" ? "0 0 60px rgba(0,0,0,0.08)" : "none",
                flexShrink: 0,
                position: "relative",
              }}>
                {sandpackMode ? (
                  <SandpackPreviewPane
                    files={files}
                    theme="light"
                    showConsole={showConsole}
                    onError={handlePreviewError}
                  />
                ) : (
                  <iframe
                    key={iframeKey}
                    srcDoc={previewSrc || '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#999;background:#f5f5f5"><p>AI에게 무엇을 만들지 알려주세요</p></body></html>'}
                    style={{ width: "100%", height: previewHeightPx ? `${previewHeightPx}px` : (previewPx ? "100vh" : "100%"), border: "none", display: "block" }}
                    title="앱 미리보기"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* AI code explain panel — slides in from right */}
                <HistoryPanel
                  open={showHistory}
                  onClose={() => setShowHistory(false)}
                  onSelect={(p) => { setAiInput(p); setShowHistory(false); }}
                />
                {showExplain && (
                  <ExplainPanel
                    html={files["index.html"]?.content ?? ""}
                    css={files["style.css"]?.content ?? ""}
                    js={files["script.js"]?.content ?? ""}
                    appName={aiMsgs[0]?.text?.slice(0, 40) ?? "이 앱"}
                    onClose={() => setShowExplain(false)}
                  />
                )}

                {/* Error overlay — shows JS runtime errors directly in preview */}
                {errorCount > 0 && logs.filter(l => l.level === "error").length > 0 && (
                  <div style={{
                    position: "absolute", bottom: 44, left: 12, right: 12,
                    background: "rgba(24,8,8,0.92)", backdropFilter: "blur(6px)",
                    border: "1px solid #f87171", borderRadius: 8,
                    padding: "10px 14px", maxHeight: 160, overflowY: "auto",
                    zIndex: 39, pointerEvents: "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "#f87171", fontWeight: 700 }}>⚠ {errorCount}개 오류</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>— 콘솔 탭에서 전체 확인</span>
                    </div>
                    {logs.filter(l => l.level === "error").slice(-3).map((log, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#fca5a5", fontFamily: "monospace", marginBottom: 2, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {log.msg}
                      </div>
                    ))}
                  </div>
                )}
                {/* AI 자동 수정 배너 — 에러 감지 시 하단 오버레이 */}
                <AutoFixBanner
                  autoFixErrors={autoFixErrors}
                  onCancelCountdown={cancelAutoFixCountdown}
                />
              </div>
            </div>
          )}

          {/* ── Console (프리뷰 하단에 표시 — 에디터 모드에서도 접근 가능) ── */}
          {showConsole && (
            <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.topbar, transition: "height 0.2s ease" }}>
              {/* Console drag handle — mouse + touch */}
              <div
                onMouseDown={startDragConsole}
                onTouchStart={touchDragConsole}
                style={{ height: 8, cursor: "row-resize", background: draggingConsole ? T.borderHi : "transparent", transition: "background 0.12s", touchAction: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = T.border)}
                onMouseLeave={e => { if (!draggingConsole) e.currentTarget.style.background = "transparent"; }}
              />
              {/* Console tabs */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${T.border}`, padding: "0 12px", gap: 2 }}>
                {(["console", "terminal"] as const).map(tab => (
                  <button key={tab} onClick={() => setBottomTab(tab)}
                    style={{
                      padding: "7px 12px", fontSize: 11, fontWeight: 600,
                      border: "none", cursor: "pointer", fontFamily: "inherit", background: "transparent",
                      color: bottomTab === tab ? T.accent : T.muted,
                      borderBottom: bottomTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
                      transition: "color 0.12s",
                    }}>
                    {tab === "console" ? "Console" : "Terminal"}
                  </button>
                ))}
                {/* Error/warn count badges */}
                {logs.filter(l => l.level === "error").length > 0 && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(248,113,113,0.15)", color: T.red, fontWeight: 700, marginLeft: 4 }}>
                    {logs.filter(l => l.level === "error").length}
                  </span>
                )}
                {logs.filter(l => l.level === "warn").length > 0 && (
                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(251,146,60,0.15)", color: T.warn, fontWeight: 700 }}>
                    {logs.filter(l => l.level === "warn").length}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {logs.filter(l => l.level === "error").length > 0 && (
                  <button
                    onClick={autoFixErrors}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      border: "none",
                      background: `linear-gradient(135deg,${T.accent},${T.accentB})`,
                      color: "#fff", cursor: "pointer", fontFamily: "inherit",
                    }}>
                    &#10022; AI 자동수정{autoFixCountdown !== null && <span style={{ opacity: 0.75 }}> ({autoFixCountdown}s)</span>}
                  </button>
                )}
                {logs.filter(l => l.level === "error" || l.level === "warn").length > 0 && (
                  <button
                    onClick={handleAiDebug}
                    disabled={aiLoading}
                    title="AI가 에러를 분석하고 수정 방법을 제안합니다"
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                      border: "none",
                      background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                      color: "#fff", cursor: aiLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit", opacity: aiLoading ? 0.6 : 1,
                    }}>
                    🤖 AI 디버그
                  </button>
                )}
                {/* Clear console */}
                <button onClick={() => setLogs([])} title="콘솔 비우기"
                  style={{ padding: "3px 8px", border: "none", background: "transparent", color: T.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >지우기</button>
                <button onClick={() => setShowConsole(false)} title="콘솔 닫기"
                  style={{ padding: "4px 8px", border: "none", background: "transparent", color: T.muted, cursor: "pointer", fontSize: 16, transition: "color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >&times;</button>
              </div>
              {/* Console content */}
              <div style={{ height: consoleH, overflow: "auto", padding: "8px 12px", fontSize: 11, fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: 1.6 }}>
                {logs.length === 0 ? (
                  <div style={{ color: T.muted, padding: "20px 0", textAlign: "center", fontSize: 12 }}>
                    <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>{"\u2728"}</div>
                    콘솔 출력이 여기에 표시됩니다
                  </div>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} style={{
                      padding: "3px 0", color: l.level === "error" ? T.red : l.level === "warn" ? T.warn : l.level === "info" ? T.info : T.muted,
                      borderBottom: `1px solid ${T.border}`,
                    }}>
                      <span style={{ color: "#9ca3af", marginRight: 8, fontSize: 10 }}>[{l.ts || new Date().toLocaleTimeString("ko-KR")}]</span>
                      {l.msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Console toggle bar */}
          {!showConsole && errorCount > 0 && (
            <button onClick={() => setShowConsole(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 12px", borderTop: `1px solid ${T.border}`, flexShrink: 0, width: "100%",
                background: `linear-gradient(180deg, rgba(248,113,113,0.06) 0%, ${T.topbar} 100%)`,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                color: T.red, fontSize: 11, fontWeight: 600, transition: "all 0.15s",
              }}>
              <span>&#9888; {errorCount} errors</span>
              {autoFixCountdown !== null && (
                <span style={{ color: T.accent, fontSize: 10, fontWeight: 700, background: `${T.accent}15`, padding: "1px 6px", borderRadius: 6 }}>
                  &#10022; 자동수정 {autoFixCountdown}s
                </span>
              )}
              <span style={{ color: T.muted, fontWeight: 400 }}>&middot; 클릭하여 콘솔 열기</span>
            </button>
          )}
        </div>
      </div>

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
            style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 24, padding: "36px 32px", width: 520, maxWidth: "90vw", boxShadow: "0 40px 100px rgba(0,0,0,0.12)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
              <h2 id="upgrade-modal-title" style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: "0 0 8px" }}>AI 한도에 도달했습니다</h2>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                업그레이드하면 더 많은 AI 요청과 고급 기능을 사용할 수 있습니다.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { name: "프로", price: "₩39,000", desc: "무제한", color: T.accent, popular: true },
                { name: "팀", price: "₩99,000", desc: "무제한 + 전담 지원", color: T.accent, popular: false },
              ].map(plan => (
                <div key={plan.name}
                  style={{ background: plan.popular ? `${T.accent}15` : "rgba(255,255,255,0.05)", border: `2px solid ${plan.popular ? T.borderHi : T.border}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}>
                  {plan.popular && <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 8, letterSpacing: "0.05em" }}>✦ 가장 인기</div>}
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 11, color: T.muted }}> / 월</span></div>
                  <div style={{ fontSize: 11, color: T.muted }}>AI {plan.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: T.text }}>지금 다른 모델로 전환해볼 수도 있어요:</strong> 상단의 모델 선택에서
              {aiMode === "openai" ? " Anthropic 또는 Gemini" : aiMode === "anthropic" ? " OpenAI 또는 Gemini" : " OpenAI 또는 Anthropic"} 선택
            </div>
            <button onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}
              style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              플랜 업그레이드 →
            </button>
            <button onClick={() => setShowUpgradeModal(false)}
              style={{ width: "100%", padding: "10px", background: "transparent", color: T.muted, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              나중에 하기
            </button>
          </div>
        </div>
      )}

      <PublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        publishedUrl={publishedUrl}
        tokenBalance={tokenBalance ?? 0}
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
            style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 20, padding: "28px 24px", width: 640, maxWidth: "92vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 id="tpl-gallery-title" style={{ fontSize: 18, fontWeight: 900, color: T.text, margin: 0 }}>📦 템플릿 갤러리</h2>
                <p style={{ fontSize: 11, color: T.muted, margin: "4px 0 0" }}>클릭 한 번으로 즉시 생성 — AI 호출 없이 0ms</p>
              </div>
              <button onClick={() => setShowTemplates(false)}
                style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
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
                    border: `1px solid ${T.border}`,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = "none"; }}
                >
                  <span style={{ fontSize: 32 }}>{tpl.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{tpl.name}</span>
                  <span style={{ fontSize: 10, color: T.muted, lineHeight: 1.5, textAlign: "center" }}>{tpl.description}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>{tpl.category}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: T.text }}>팁:</strong> AI에게 &ldquo;테트리스 만들어줘&rdquo; 또는 &ldquo;계산기 만들어줘&rdquo;라고 말해도 자동으로 템플릿이 적용됩니다.
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div ref={ctxMenuRef} role="menu" aria-label="파일 컨텍스트 메뉴" onClick={e => e.stopPropagation()}
          style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden", minWidth: 140 }}>
          {[
            { label: "파일 열기", action: () => { openFile(ctxMenu.file); setCtxMenu(null); } },
            { label: "삭제", action: () => deleteFile(ctxMenu.file), danger: true },
          ].map(item => (
            <button key={item.label} role="menuitem" onClick={item.action}
              style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", color: (item as { danger?: boolean }).danger ? T.red : T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
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

      {/* Remote (Cloud) Version History Panel */}
      {showRemoteVersions && projectId && (
        <ErrorBoundary>
          <div style={{
            position: "fixed", inset: 0, zIndex: 800,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setShowRemoteVersions(false)}>
            <div onClick={e => e.stopPropagation()} style={{ height: "70vh", minHeight: 400 }}>
              <RemoteVersionHistoryPanel
                projectId={projectId}
                onRestore={(restored) => {
                  pushHistory("버전 복원 전");
                  setFiles(restored);
                  showToast("\u2601\uFE0F 클라우드 버전 복원 완료");
                  setShowRemoteVersions(false);
                }}
                onClose={() => setShowRemoteVersions(false)}
              />
            </div>
          </div>
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

      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,6px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{opacity:0.85;box-shadow:0 0 0 4px rgba(239,68,68,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
        textarea::placeholder { color: #9ca3af; }
        select option { background: #1e293b; color: #f0f4f8; }
      `}</style>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", animation: `dotBounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>
          ))}
        </div>
        <style>{`@keyframes dotBounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
      </div>
    }>
      <WorkspaceIDE />
    </Suspense>
  );
}
