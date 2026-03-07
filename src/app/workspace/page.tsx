"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  T, DEFAULT_FILES,
  extToLang,
  buildPreview, injectConsoleCapture, injectCdns, injectEnvVars,
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
import { detectCommercialRequest, detectQualityUpgrade, buildForcedPipeline, buildStepPrompt, getStepLabel } from "./ai/commercialPipeline";
import type { PipelineConfig } from "./ai/commercialPipeline";
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
import { PreviewHeaderToolbar } from "./PreviewHeaderToolbar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { WorkspaceFileTree } from "./WorkspaceFileTree";
import { WorkspaceEditorPane } from "./WorkspaceEditorPane";
import { ActivityBar } from "./ActivityBar";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { useSwipe } from "@/hooks/useSwipe";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { hapticLight } from "@/utils/haptics";
import InstallBanner from "@/components/InstallBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
const KeyboardShortcutsModal = dynamic(() => import("./KeyboardShortcutsModal").then(m => ({ default: m.KeyboardShortcutsModal })), { ssr: false });
const FileSearchPanel = dynamic(() => import("./FileSearchPanel").then(m => ({ default: m.FileSearchPanel })), { ssr: false });
const VersionHistoryPanel = dynamic(() => import("./VersionHistoryPanel"), { ssr: false });
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
  } = useFileSystemStore();

  const {
    projectId, projectName,
    setProjectId, setProjectName, setProjects, setShowProjects,
  } = useProjectStore();

  const {
    aiInput, aiMsgs, aiLoading, streamingText, aiMode, selectedModelId,
    imageAtt, isRecording, showTemplates, autoFixCountdown,
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

  // Voice
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoFixAttempts = useRef(0);
  const templateAppliedAt = useRef(0);
  const filesRef = useRef(files);
  const cdnRef = useRef(cdnUrls);
  const envRef = useRef(envVars);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { cdnRef.current = cdnUrls; }, [cdnUrls]);
  useEffect(() => { envRef.current = envVars; }, [envVars]);

  // Editor visibility (hidden by default — Claude+Replit 2-panel layout)
  const [showEditor, setShowEditor] = useState(false);

  // Extended mobile panel (3-panel: files | ai | preview)
  // Wraps the store's mobilePanel ("ai"|"preview") with additional "files" option
  const [mobilePanelExt, setMobilePanelExt] = useState<"files" | "ai" | "preview">(mobilePanel as "ai" | "preview");
  const setMobilePanelAll = useCallback((v: "files" | "ai" | "preview") => {
    setMobilePanelExt(v);
    if (v === "ai" || v === "preview") setMobilePanel(v);
  }, [setMobilePanel]);

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
          localStorage.setItem(CUR_KEY, newId);
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
            // 빈 files 보호: 서버 stub(files:{})은 DEFAULT_FILES 사용
            const safeFiles = Object.keys(proj.files).length > 0 ? proj.files : DEFAULT_FILES;
            setFiles(safeFiles);
            setProjectName(proj.name);
            setProjectId(id);
            setOpenTabs(Object.keys(safeFiles).slice(0, 5));
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

    // 월별 사용량 조회 (Pro/Team)
    fetch("/api/billing/usage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.metered) setMonthlyUsage(d.metered); })
      .catch(() => {});

    // ── Auto-query: pre-fill AI and trigger ────────────────────────────────
    if (autoQuery) {
      setAiInput(autoQuery);
      // Slight delay to let component mount fully
      setTimeout(() => {
        setAiInput(autoQuery);
      }, 800);
    }

    // 2. Sync token balance from server
    fetch("/api/tokens")
      .then(r => r.json())
      .then(d => { if (typeof d.balance === "number") { setTokenBalance(d.balance); setTokenStore(d.balance); } })
      .catch(() => {});

    // 3. Merge server projects into localStorage (background)
    fetch("/api/projects")
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
      .catch(() => {});
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

  // Auto-fix countdown: 에러 발생 후 2초 뒤 자동 AI 수정 (최대 3회, 템플릿 적용 직후 억제)
  useEffect(() => {
    const MAX_AUTO_FIX = 3;
    const TEMPLATE_COOLDOWN = 3000; // 템플릿 적용 후 3초간 억제
    const sinceTemplate = Date.now() - templateAppliedAt.current;
    if (errorCount > 0 && !aiLoading && autoFixAttempts.current < MAX_AUTO_FIX && sinceTemplate > TEMPLATE_COOLDOWN) {
      let count = 2;
      setAutoFixCountdown(count);
      if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current);
      autoFixTimerRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(autoFixTimerRef.current!);
          autoFixTimerRef.current = null;
          setAutoFixCountdown(null);
          autoFixAttempts.current++;
          autoFixErrors();
        } else {
          setAutoFixCountdown(count);
        }
      }, 1000);
    } else {
      if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current);
      setAutoFixCountdown(null);
    }
    return () => { if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); } };
  }, [errorCount]); // eslint-disable-line

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
        setPreviewSrc(injectConsoleCapture(html));
        setIframeKey(k => k + 1);
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
    setPreviewSrc(injectConsoleCapture(html));
    setIframeKey(k => k + 1);
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
          openai: "gpt-4o", anthropic: "claude-sonnet-4-6",
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

  // AI — guard flag prevents race condition from double-clicks
  const aiLockRef = useRef(false);
  const runAI = async (prompt: string, _isFirst = false) => {
    if (aiLoading || aiLockRef.current) return;
    aiLockRef.current = true;
    setAiLoading(true);
    dispatchAgent({ type: "START", prompt });
    setStreamingText("");
    const img = imageAtt;
    setImageAtt(null);
    setAiMsgs(p => [...p, { role: "user", text: prompt, ts: nowTs(), image: img?.preview }]);

    // ── Smart Router: intent detection ────────────────────────────────────────
    const hasExistingCode = Object.values(filesRef.current).some(
      f => f.content.length > 200 && !f.content.includes("Dalkak IDE"),
    );
    const isQualityUpgrade = detectQualityUpgrade(prompt) && hasExistingCode;

    // ── #1 Quality Upgrade: refinement pipeline on existing code ────────────
    if (isQualityUpgrade) {
      const cost = calcCost(prompt);
      const bal = getTokens();
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
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
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
        if ((err as Error)?.name !== "AbortError") {
          setAiMsgs(p => [...p, { role: "agent", text: `⚠️ 품질 개선 오류: ${(err as Error)?.message || "연결 실패"}`, ts: nowTs() }]);
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
        setTimeout(() => {
          let html = buildPreview(updated);
          if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
          html = injectEnvVars(html, envRef.current);
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
          setHasRun(true); setLogs([]); setErrorCount(0);
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
    setTokenStore(newBal);
    setTokenBalance(newBal);
    fetch("/api/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: -cost }),
    }).catch(() => {});

    // ── #3+#4 Commercial pipeline (auto-detect OR forced by commercial mode) ─
    // 플랫폼 키워드 감지 시 또는 상용급 모드 활성 시 상용급 파이프라인 실행
    const pipeline = commercialMode ? (detectCommercialRequest(prompt) ?? buildForcedPipeline(prompt)) : detectCommercialRequest(prompt);
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

        if (!modelMeta || modelMeta.maxOutput < 16000) {
          // Auto-upgrade: prefer Claude Sonnet 4.6 (64K output) for commercial
          const bestModel = getBestModelForTask("code");
          if (bestModel && bestModel.maxOutput >= 16000) {
            pipelineModelId = bestModel.id;
            pipelineMode = bestModel.provider;
            showToast(`🔄 상용급 생성을 위해 ${bestModel.label} (${(bestModel.maxOutput / 1000).toFixed(0)}K 출력)으로 자동 전환합니다.`);
          } else if (modelMeta) {
            showToast(`⚠️ ${modelMeta.label}의 최대 출력(${modelMeta.maxOutput} 토큰)이 제한적입니다. Claude Sonnet 4.6 (64K) 사용을 권장합니다.`);
          }
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
            }
          }

          // Parse and apply this step's output
          const parsed = parseAiResponse(acc);
          for (const [fname, content] of Object.entries(parsed.fullFiles)) {
            updated[fname] = { name: fname, language: extToLang(fname), content };
          }
          stepOutputs[step.id] = acc;
          setFiles({ ...updated });

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
            const pipelineMeta = getModelMeta(pipelineModelId);
            const phaseBody = {
              system: pipelineSystemMsg,
              messages: [{ role: "user", content: phasePrompt }],
              mode: pipelineMode,
              model: pipelineModelId,
              temperature,
              maxTokens: pipelineMeta?.maxOutput ?? effectiveMaxTokens,
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
              if (phaseReader) {
                while (true) {
                  const { done, value } = await phaseReader.read();
                  if (done) break;
                  for (const line of phaseDec.decode(value).split("\n")) {
                    if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                      try { const { text } = JSON.parse(line.slice(6)); if (text) phaseAcc += text; } catch {}
                    }
                  }
                }
              }

              if (!phaseAcc.includes("모든 검증 통과")) {
                const phaseParsed = parseAiResponse(phaseAcc);
                for (const [fname, content] of Object.entries(phaseParsed.fullFiles)) {
                  updated[fname] = { name: fname, language: extToLang(fname), content };
                }
                setFiles({ ...updated });
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
                mode: pipelineMode, model: pipelineModelId, temperature: 0.3, maxTokens: 1024,
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
                  mode: pipelineMode, model: pipelineModelId, temperature,
                  maxTokens: getModelMeta(pipelineModelId)?.maxOutput ?? effectiveMaxTokens,
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
          let html = buildPreview(updated);
          if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
          html = injectEnvVars(html, envRef.current);
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
          setHasRun(true); setLogs([]); setErrorCount(0);
        }, 100);

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

        // If quality check failed with errors, auto-fix
        if (!qReport.passed && qReport.issues.some(i => i.severity === "error")) {
          const fixPrompt = buildQualityFixPrompt(qReport);
          if (fixPrompt) {
            setTimeout(() => runAI(fixPrompt), 1500);
          }
        }

        // ── #5 Auto-Improve Agent: background analysis after generation ─────
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
          setAiMsgs(p => [...p, {
            role: "agent",
            text: `⚠️ 상용급 파이프라인 오류: ${(err as Error)?.message || "연결 실패"}\n토큰이 복구되었습니다. 일반 모드로 자동 재시도합니다...`,
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
        30000,
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

      // Timeout: abort if no response in 60s
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 60_000);
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 402) {
        // Refund tokens on billing limit
        const refunded402 = getTokens() + cost;
        setTokenStore(refunded402);
        setTokenBalance(refunded402);
        fetch("/api/tokens", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: cost }) }).catch(() => {});
        const limitBody = await res.json().catch(() => ({}));
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
                    try {
                      let liveHtml = buildPreview(liveUpdated);
                      if (cdnRef.current.length > 0) liveHtml = injectCdns(liveHtml, cdnRef.current);
                      liveHtml = injectEnvVars(liveHtml, envRef.current);
                      setPreviewSrc(injectConsoleCapture(liveHtml));
                      setIframeKey(k => k + 1);
                      setHasRun(true);
                    } catch {}
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

        // EDIT 패치 전체 실패 → 자동으로 전체 파일 재작성 요청
        if (failedPatchFiles.length > 0 && changed.length === 0 && autoFixAttempts.current < 2) {
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
        setFiles(updated);
        setChangedFiles(changed);
        setTimeout(() => setChangedFiles([]), 3000);
        setOpenTabs(p => {
          const next = [...p];
          for (const fname of changed) if (!next.includes(fname)) next.push(fname);
          return next;
        });
        setTimeout(() => {
          let html = buildPreview(updated);
          if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
          html = injectEnvVars(html, envRef.current);
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
          setHasRun(true);
          setLogs([]); setErrorCount(0);
        }, 100);
        // 코드 생성 완료 후 자동 테스트 실행 (프리뷰 로드 대기 후)
        setTimeout(() => autoTest(), 2200);
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
            templateAppliedAt.current = Date.now();
            autoFixAttempts.current = 0;
            // 프리뷰 즉시 갱신
            setTimeout(() => {
              let html = buildPreview(updated);
              if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
              html = injectEnvVars(html, envRef.current);
              setPreviewSrc(injectConsoleCapture(html));
              setIframeKey(k => k + 1);
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
              const truncPrompt = `이전 응답에서 ${truncatedFiles.join(", ")} 파일이 중간에 잘렸습니다. 해당 파일의 나머지 내용을 이어서 완성해주세요. 반드시 [FILE:파일명]...[/FILE] 형식으로 전체 파일을 출력하고, 절대 중간에 자르지 마세요.`;
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
            setPreviewSrc(injectConsoleCapture(html));
            setIframeKey(k => k + 1);
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
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
          setHasRun(true); setLogs([]); setErrorCount(0);
        }, 100);
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 서비스 오류가 발생했지만, 🎮 내장 템플릿으로 게임을 생성했습니다!\n토큰이 복구되었습니다. (${tokToUSD(refunded)})\n\n게임을 플레이해보세요!`,
          ts: nowTs(),
        }]);
      } else if ((err as Error)?.name !== "AbortError") {
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 오류: ${(err as Error)?.message || "연결 실패"}\n토큰이 복구되었습니다. (${tokToUSD(refunded)})\n\n🔑 /settings에서 API 키를 확인하거나, 아래 버튼으로 재시도해주세요.\n[RETRY:${prompt}]`,
          ts: nowTs(),
        }]);
      }
    }
    // Finalize agent state machine
    dispatchAgent({ type: "COMPLETE" });
    dispatchAgent({ type: "RESET" });
    setAiLoading(false);
    aiLockRef.current = false;
    abortRef.current = null;
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
      fixPrompt = `다음 에러만 정확히 수정해줘. 다른 코드는 건드리지 마. [FILE:파일명]...[/FILE]로 수정된 파일만 출력.\n\n에러:\n${errs}\n\n현재 코드:\n${code}`;
    }

    runAI(fixPrompt);
    setLeftTab("ai");
  };

  const handleAiSend = () => {
    const t = aiInput.trim();
    if (!t || aiLoading) return;
    setAiInput("");
    autoFixAttempts.current = 0; // 사용자 직접 입력 시 자동수정 카운터 리셋
    runAI(t);
  };

  // Share
  const shareProject = () => {
    const html = injectEnvVars(buildPreview(files), envRef.current);
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
      const html = injectConsoleCapture(injectEnvVars(buildPreview(filesRef.current), envRef.current));
      // Try server publish first
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
      } else {
        // Fallback: compressed URL (offline / not logged in)
        const compressed = await compressHtml(html);
        const fallbackUrl = `${window.location.origin}/p#${encodeURIComponent(projectName)}:${compressed}`;
        setPublishedUrl(fallbackUrl);
        setShowPublishModal(true);
        await navigator.clipboard.writeText(fallbackUrl).catch(() => {});
        showToast("🚀 배포 완료 (로그인 시 실제 URL 발급)");
      }
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
      localStorage.setItem(CUR_KEY, p.id);
      setShowProjects(false);
      setHistory([]);
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
    if (!openTabs.includes(filename)) setOpenTabs(prev => [...prev, filename]);
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

  // Keyboard shortcuts (existing handler for Escape + Ctrl+Z/K)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
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

  // ── RENDER ─────────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => { setCtxMenu(null); setShowProjects(false); }}
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: T.bg, color: T.text,
        fontFamily: '"Pretendard","Inter",-apple-system,sans-serif',
        overflow: "hidden",
        cursor: draggingLeft || draggingRight || draggingConsole ? "col-resize" : "default",
        userSelect: draggingLeft || draggingRight || draggingConsole ? "none" : "auto",
      }}
    >
      {/* ══ TOP BAR ════════════════════════════════════════════════════════════ */}
      <WorkspaceTopBar
        router={router}
        nameRef={nameRef}
        runProject={runProject}
        publishProject={publishProject}
        shareProject={shareProject}
        loadProject={loadProject}
      />

      {/* ── Version History trigger (next to TopBar undo) ─────────────── */}
      {history.length > 0 && (
        <button
          onClick={() => setShowVersionHistory(true)}
          title="버전 히스토리"
          style={{
            position: "absolute", top: 7, right: 10, zIndex: 60,
            padding: "4px 9px", borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "#f3f4f6",
            color: T.muted, fontSize: 11, cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          {"\uD83D\uDD50"} {history.length}
        </button>
      )}

      {/* ── Env vars button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setShowEnvPanel(p => !p)}
        title="환경변수 패널"
        style={{
          position: "absolute", top: 7, right: history.length > 0 ? 80 : 10, zIndex: 60,
          padding: "4px 9px", borderRadius: 7,
          border: `1px solid ${showEnvPanel ? T.borderHi : T.border}`,
          background: showEnvPanel ? `${T.accent}15` : "#f3f4f6",
          color: showEnvPanel ? T.accent : T.muted, fontSize: 11, cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={e => { if (!showEnvPanel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; } }}
      >
        {"\uD83D\uDD11"}{Object.keys(envVars).length > 0 ? ` ${Object.keys(envVars).length}` : ""}
      </button>

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
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>FieldNine AI</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>코드 생성 · 실시간 프리뷰</div>
                </div>
              </div>
              <button
                onClick={() => setShowEditor(true)}
                title="코드 에디터 표시"
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: "#f3f4f6",
                  color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                  fontWeight: 600,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.accent; e.currentTarget.style.background = "rgba(249,115,22,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "#f3f4f6"; }}
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
          <PreviewHeaderToolbar
            runProject={runProject}
            autoTest={autoTest}
            onDeviceChange={setDeviceFrame}
          />

          {/* Iframe container — single or multi-preview */}
          {multiPreview ? (
            /* ── Multi-preview: 3 devices side-by-side ── */
            <div style={{
              flex: 1, overflow: "auto", background: "#111118",
              display: "flex", justifyContent: "center", alignItems: "flex-start",
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
                      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
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
                <iframe
                  key={iframeKey}
                  srcDoc={previewSrc}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
                  style={{ width: "100%", height: previewHeightPx ? `${previewHeightPx}px` : (previewPx ? "100vh" : "100%"), border: "none", display: "block" }}
                  title="앱 미리보기"
                />
                {/* Error overlay — shows JS runtime errors directly in preview */}
                {errorCount > 0 && logs.filter(l => l.level === "error").length > 0 && (
                  <div style={{
                    position: "absolute", bottom: 12, left: 12, right: 12,
                    background: "rgba(24,8,8,0.92)", backdropFilter: "blur(6px)",
                    border: "1px solid #f87171", borderRadius: 8,
                    padding: "10px 14px", maxHeight: 180, overflowY: "auto",
                    zIndex: 100, pointerEvents: "none",
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
                      borderBottom: `1px solid #f9fafb`,
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
                { name: "팀", price: "₩99,000", desc: "무제한 + 전담 지원", color: "#60a5fa", popular: false },
              ].map(plan => (
                <div key={plan.name}
                  style={{ background: plan.popular ? `${T.accent}15` : "#f9fafb", border: `2px solid ${plan.popular ? T.borderHi : T.border}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}>
                  {plan.popular && <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 8, letterSpacing: "0.05em" }}>✦ 가장 인기</div>}
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 11, color: T.muted }}> / 월</span></div>
                  <div style={{ fontSize: 11, color: T.muted }}>AI {plan.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
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
        tokenBalance={tokenBalance}
        showToast={showToast}
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
                        setPreviewSrc(injectConsoleCapture(html));
                        setIframeKey(k => k + 1);
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
                    background: "#f9fafb",
                    border: `1px solid ${T.border}`,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.transform = "none"; }}
                >
                  <span style={{ fontSize: 32 }}>{tpl.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{tpl.name}</span>
                  <span style={{ fontSize: 10, color: T.muted, lineHeight: 1.5, textAlign: "center" }}>{tpl.description}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    color: tpl.category === "game" ? "#f59e0b" : tpl.category === "app" ? "#60a5fa" : "#a78bfa",
                    background: tpl.category === "game" ? "rgba(245,158,11,0.1)" : tpl.category === "app" ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)",
                    padding: "2px 8px", borderRadius: 6,
                  }}>{tpl.category}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#fafafa", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
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
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
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
        select option { background: #ffffff; color: #1b1b1f; }
      `}</style>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
