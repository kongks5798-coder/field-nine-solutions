"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  T, CDN_PKGS, DEFAULT_FILES,
  extToLang, fileIcon, escRx,
  buildPreview, injectConsoleCapture, injectCdns,
  parseAiFiles, nowTs, logColor,
  TOK_KEY, TOK_INIT, getTokens, setTokenStore, calcCost, tokToUSD,
  compressHtml, AI_HIST_KEY, PROJ_KEY, CUR_KEY,
} from "./workspace.constants";
import type {
  Lang, FilesMap, LeftTab,
  LogLevel, LogEntry, AiMsg, HistoryEntry, Project, PreviewWidth,
} from "./workspace.constants";
import { WorkspaceToast } from "./WorkspaceToast";
import { DragHandle } from "./DragHandle";
import { CdnModal } from "./CdnModal";
import { OnboardingModal } from "./OnboardingModal";
import { PublishModal } from "./PublishModal";
import { AiChatPanel } from "./AiChatPanel";
import { ConsolePanel } from "./ConsolePanel";
import { PreviewHeaderToolbar } from "./PreviewHeaderToolbar";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { WorkspaceFileTree } from "./WorkspaceFileTree";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });


// ── Project storage ────────────────────────────────────────────────────────────
function loadProjects(): Project[] {
  try { return JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]"); } catch { return []; }
}
function saveProjectToStorage(p: Project) {
  const all = loadProjects();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.unshift(p);
  localStorage.setItem(PROJ_KEY, JSON.stringify(all.slice(0, 20)));
}
function genId(): string {
  // UUID v4 — matches Supabase projects.id column type (UUID)
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── AI System Prompt ────────────────────────────────────────────────────────────
const AI_SYSTEM = `You are an elite senior web developer inside FieldNine IDE — a Replit/CodeSandbox-like browser IDE.
You build stunning, production-quality web apps using ONLY HTML, CSS, JavaScript (no server, no backend).

## ⚠️ ABSOLUTE RULE #1 — ALWAYS OUTPUT CODE, NEVER EXPLAIN
- EVERY response MUST contain [FILE:...] blocks. No exceptions.
- NEVER say "this requires a server", "you need a backend", "I cannot implement" — just BUILD IT in pure HTML/JS
- NEVER list what to do — DO IT immediately in code
- NEVER ask for clarification — make smart assumptions and build
- If a feature normally requires a server (auth, DB, payments, APIs): simulate it realistically with JavaScript (localStorage, hardcoded data, mock fetch)

## ⚠️ ABSOLUTE RULE #2 — MANDATORY FILE FORMAT
- ALWAYS wrap EVERY file in [FILE:filename.ext] ... [/FILE]
- Return COMPLETE file content — never truncate, never say "// rest of code" or "..."
- Output ALL modified files PLUS all existing files that reference them
- Zero text outside of FILE blocks — no intros, no explanations, no summaries

## ⚠️ ABSOLUTE RULE #3 — BUILD ON EXISTING CODE
- When "Current project files" are provided below, you MUST read them carefully
- Preserve ALL existing functionality — only add/modify what was requested
- Keep the same file structure, variable names, and patterns unless improving them
- When improving: make it significantly better, not just cosmetically different

## QUALITY STANDARDS — THINK "APPLE.COM / ALO YOGA / LUXURY BRAND" LEVEL
- Zero bugs, zero SyntaxErrors — mentally execute the code before outputting
- Modern ES6+: const/let, arrow functions, template literals, async/await
- Premium UI: smooth CSS @keyframes, glassmorphism, gradients, micro-interactions, hover lift effects
- Fully responsive — mobile-first (320px) to 4K desktop — CSS Grid + Flexbox
- Typography: import Google Fonts at top of CSS (@import url('https://fonts.googleapis.com/css2?family=...'))
- All buttons/forms/interactions must WORK — no dead UI elements, no "준비 중" placeholders
- Navigation: sticky header with backdrop-filter blur, smooth scroll, mobile hamburger (functional JS toggle)
- Animations: IntersectionObserver for scroll-triggered fade-ins, CSS transitions everywhere
- CSS Custom Properties: define --color-primary, --color-text, --font-heading etc at :root
- For e-commerce: full working cart in localStorage (add/remove/quantity), product grid, checkout form
- For auth: localStorage-based fake auth (stores user data, shows profile, logout works)
- For any app: minimum 350+ lines HTML, 500+ lines CSS, 250+ lines JS — NEVER generate skeleton/placeholder code
- OUTPUT LENGTH: do NOT truncate. Output the ENTIRE file even if very long. Never stop mid-code.

## ⚠️ ABSOLUTE RULE #4 — ZERO JS RUNTIME ERRORS (addEventListener null 방지)
- ALWAYS wrap ALL JavaScript initialization in: document.addEventListener('DOMContentLoaded', function() { ... });
- ALWAYS null-check before addEventListener: const el = document.getElementById('x'); if (el) el.addEventListener(...);
- NEVER call methods on a possibly-null element — use optional chaining: el?.addEventListener(...)
- NEVER reference an element ID in JS that doesn't exist in the HTML you generated
- After writing script.js, verify: every getElementById/querySelector ID MUST match an actual element in index.html
- Place ALL <script src="..."> tags at the VERY BOTTOM of <body>, after all HTML elements
- If iterating NodeLists: document.querySelectorAll('.x').forEach(el => { ... }) — always safe

## CRITICAL PROHIBITIONS
- NEVER use jQuery ($) or any undeclared library
- NEVER create loading states that never resolve
- NEVER use document.write()
- NEVER leave Promises dangling
- NEVER use external image URLs — use CSS gradients or emoji as placeholders:
  <div style="width:300px;height:200px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:32px">👗</div>

## DOMAIN / SERVER FEATURES → SIMULATE IN JS
- Domain connection → show a "배포 완료" success modal with the entered domain
- Payment → fake checkout form that shows success after 1.5s
- User accounts → localStorage-based auth (email+password stored in localStorage)
- Database → localStorage as the data store
- Email → console.log + success toast notification
- Maps → static styled div with location info

## 2026 TECH STACK (always prefer these)
- CSS: use @layer, container queries, :has(), color-mix(), oklch() colors, view transitions
- JS: use optional chaining ?., nullish coalescing ??, structuredClone(), Array.at(), Object.groupBy()
- Animations: use @starting-style, animation-timeline: scroll(), Web Animations API for complex sequences
- Fonts: always import Pretendard for Korean (https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css)
- Icons: use emoji or inline SVG — never link to icon libraries that require npm
- State: use plain JS objects + localStorage for persistence — no React/Vue in standalone HTML apps

## GROK MODE (real-time web search available)
When mode is grok: you have access to real-time web data as of 2026.
Use this for: latest library versions, current events, live data. Always cite sources inline.

## ERROR FIXING
identify cause → return corrected COMPLETE file(s) → add // FIXED: comment near the fix

## FILE FORMAT EXAMPLE
[FILE:index.html]
<!DOCTYPE html><html lang="ko">...COMPLETE HTML...</html>
[/FILE]
[FILE:style.css]
/* COMPLETE CSS — no truncation */
[/FILE]
[FILE:script.js]
// COMPLETE JavaScript
[/FILE]`;

// ── Main Component ─────────────────────────────────────────────────────────────
function WorkspaceIDE() {
  const router = useRouter();
  const params = useSearchParams();

  // Project
  const [projectId, setProjectId] = useState(() => localStorage.getItem(CUR_KEY) || genId());
  const [projectName, setProjectName] = useState("내 프로젝트");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);

  // Files
  const [files, setFiles] = useState<FilesMap>({ ...DEFAULT_FILES });
  const [activeFile, setActiveFile] = useState("index.html");
  const [openTabs, setOpenTabs] = useState<string[]>(["index.html", "style.css", "script.js"]);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // CDN
  const [cdnUrls, setCdnUrls] = useState<string[]>([]);
  const [showCdnModal, setShowCdnModal] = useState(false);
  const [customCdn, setCustomCdn] = useState("");

  // Layout
  const [leftTab, setLeftTab] = useState<LeftTab>("ai");
  const [leftW, setLeftW] = useState(265);
  const [rightW, setRightW] = useState(440);
  const [consoleH, setConsoleH] = useState(130);
  const [showConsole, setShowConsole] = useState(true);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("full");

  // Preview
  const [previewSrc, setPreviewSrc] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);

  // Console
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // AI
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState<AiMsg[]>(() => {
    try { return JSON.parse(localStorage.getItem("f9_ai_hist_v1") ?? "[]"); } catch { return []; }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [autoFixCountdown, setAutoFixCountdown] = useState<number | null>(null);
  const [agentPhase, setAgentPhase] = useState<"planning" | "coding" | "reviewing" | null>(null);
  const [aiMode, setAiMode] = useState("anthropic");
  const [streamingText, setStreamingText] = useState("");
  const [imageAtt, setImageAtt] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  // Voice
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // UI
  const [editingName, setEditingName] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; file: string } | null>(null);
  const [toast, setToast] = useState("");
  const [draggingLeft, setDraggingLeft] = useState(false);
  const [draggingRight, setDraggingRight] = useState(false);
  const [draggingConsole, setDraggingConsole] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [autoTesting, setAutoTesting] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(TOK_INIT);
  const [monthlyUsage, setMonthlyUsage] = useState<{ amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number } | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [autonomyLevel, setAutonomyLevel] = useState<"low" | "medium" | "high" | "max">("high");
  const [buildMode, setBuildMode] = useState<"fast" | "full">("fast");
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"ai" | "preview">("ai");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filesRef = useRef(files);
  const cdnRef = useRef(cdnUrls);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { cdnRef.current = cdnUrls; }, [cdnUrls]);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
      const id = localStorage.getItem(CUR_KEY);
      if (id) {
        const all = loadProjects();
        const proj = all.find(p => p.id === id);
        if (proj) {
          setFiles(proj.files);
          setProjectName(proj.name);
          setProjectId(id);
          setOpenTabs(Object.keys(proj.files).slice(0, 5));
        }
      }
    }

    setProjects(loadProjects());
    setTokenBalance(getTokens());

    // 신규 사용자 온보딩 (최초 방문 시 1회)
    if (!localStorage.getItem("fn_onboarded")) {
      setTimeout(() => setShowOnboarding(true), 1200);
    }

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
        localStorage.setItem(PROJ_KEY, JSON.stringify(merged.slice(0, 50)));
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
      localStorage.setItem(CUR_KEY, projectId);
      setProjects(loadProjects());
      // Background server save
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, name: projectName, files: filesRef.current, updatedAt: proj.updatedAt }),
      })
        .then(() => { setSaving("saved"); setTimeout(() => setSaving("idle"), 2000); })
        .catch(() => { setSaving("idle"); });
    }, 1500);
  }, [files, projectName, projectId]);

  // AI history persistence
  useEffect(() => {
    try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(aiMsgs.slice(-60))); } catch {}
  }, [aiMsgs]); // eslint-disable-line

  // Auto-fix countdown: 에러 발생 후 5초 뒤 자동 AI 수정
  useEffect(() => {
    if (errorCount > 0 && !aiLoading) {
      let count = 5;
      setAutoFixCountdown(count);
      if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current);
      autoFixTimerRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(autoFixTimerRef.current!);
          autoFixTimerRef.current = null;
          setAutoFixCountdown(null);
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
  }, []);

  useEffect(() => {
    const h = () => { setCtxMenu(null); setShowProjects(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // Debounced auto-run
  useEffect(() => {
    if (!hasRun) return;
    if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
    setPreviewRefreshing(true);
    autoRunTimer.current = setTimeout(() => {
      try {
        let html = buildPreview(filesRef.current);
        if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
        setPreviewSrc(injectConsoleCapture(html));
        setIframeKey(k => k + 1);
      } finally {
        setPreviewRefreshing(false);
      }
    }, 500);
    return () => { if (autoRunTimer.current) clearTimeout(autoRunTimer.current); };
  }, [files, cdnUrls]); // eslint-disable-line

  const runProject = useCallback(() => {
    setLogs([]); setErrorCount(0);
    let html = buildPreview(filesRef.current);
    if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
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
    if (q) { if (m) setAiMode(m); setLeftTab("ai"); setTimeout(() => runAI(q, true), 400); }
  }, []); // eslint-disable-line

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2400); };

  // Drag handlers
  const startDragLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingLeft(true);
    const onMove = (ev: MouseEvent) => setLeftW(Math.min(Math.max(ev.clientX, 180), 420));
    const onUp = () => { setDraggingLeft(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, []);
  const startDragRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingRight(true);
    const onMove = (ev: MouseEvent) => setRightW(Math.min(Math.max(window.innerWidth - ev.clientX, 260), 800));
    const onUp = () => { setDraggingRight(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, []);
  const startDragConsole = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); setDraggingConsole(true);
    const startY = e.clientY; const startH = consoleH;
    const onMove = (ev: MouseEvent) => setConsoleH(Math.min(Math.max(startH + (startY - ev.clientY), 50), 400));
    const onUp = () => { setDraggingConsole(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [consoleH]);

  // File ops
  const openFile = (name: string) => {
    setActiveFile(name);
    if (!openTabs.includes(name)) setOpenTabs(p => [...p, name]);
  };
  const closeTab = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = openTabs.filter(t => t !== name);
    setOpenTabs(next);
    if (activeFile === name) setActiveFile(next[next.length - 1] ?? Object.keys(files)[0] ?? "");
  };
  const updateFileContent = (content: string) => {
    setFiles(p => ({ ...p, [activeFile]: { ...p[activeFile], content } }));
  };
  const createFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    setFiles(p => ({ ...p, [name]: { name, language: extToLang(name), content: "" } }));
    openFile(name);
    setShowNewFile(false); setNewFileName("");
  };
  const deleteFile = (name: string) => {
    setFiles(p => { const n = { ...p }; delete n[name]; return n; });
    setOpenTabs(p => p.filter(t => t !== name));
    if (activeFile === name) setActiveFile(Object.keys(files).find(k => k !== name) ?? "");
    setCtxMenu(null);
  };

  // History / undo
  const pushHistory = (label: string) => {
    setHistory(h => [...h.slice(-19), { files: { ...filesRef.current }, ts: nowTs(), label }]);
  };
  const revertHistory = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setFiles(last.files);
      showToast("↩ 되돌리기 완료");
      return h.slice(0, -1);
    });
  }, []); // eslint-disable-line

  // Image attachment
  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const [meta, data] = result.split(",");
      const mimeMatch = meta.match(/data:([^;]+)/);
      setImageAtt({ base64: data, mime: mimeMatch?.[1] ?? "image/png", preview: result });
    };
    reader.readAsDataURL(file);
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const img = items.find(i => i.type.startsWith("image/"));
    if (img) { const f = img.getAsFile(); if (f) { handleImageFile(f); e.preventDefault(); } }
  };

  // Voice input
  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
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

  // AI
  const runAI = async (prompt: string, _isFirst = false) => {
    if (aiLoading) return;
    setAiLoading(true);
    setAgentPhase("planning");
    setStreamingText("");
    const img = imageAtt;
    setImageAtt(null);
    setAiMsgs(p => [...p, { role: "user", text: prompt, ts: nowTs(), image: img?.preview }]);

    // Token check & deduction
    const cost = calcCost(prompt);
    const bal = getTokens();
    if (bal < cost) {
      setAiMsgs(p => [...p, { role: "agent", text: `⚠️ 토큰 부족\n잔액: ${tokToUSD(bal)} | 필요: ${tokToUSD(cost)}\n\n/pricing에서 토큰을 충전해주세요.`, ts: nowTs() }]);
      setAiLoading(false);
      return;
    }
    const newBal = bal - cost;
    setTokenStore(newBal);
    setTokenBalance(newBal);
    // Sync token deduction to server
    fetch("/api/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: -cost }),
    }).catch(() => {});

    try {
      abortRef.current = new AbortController();
      pushHistory("AI 생성 전");

      // Always send current files so AI can build on existing code (not restart from scratch)
      const hasRealFiles = Object.values(filesRef.current).some(
        f => f.content.length > 200 && !f.content.includes("FieldNine IDE")
      );
      const fileCtx = hasRealFiles
        ? "\n\n## Current project files (READ CAREFULLY — build on these, preserve all existing features):\n" +
          Object.entries(filesRef.current).map(([n, f]) => `[FILE:${n}]\n${f.content}\n[/FILE]`).join("\n")
        : "";

      const histMsgs = aiMsgs
        .filter(m => !m.image)
        .map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));

      const autonomyHint = {
        low:    "\n\n[AUTONOMY: LOW] Be very conservative. Make minimal changes. Explain every decision. Ask for clarification if anything is ambiguous.",
        medium: "\n\n[AUTONOMY: MEDIUM] Balance changes carefully. Make targeted improvements. Briefly explain key decisions.",
        high:   "\n\n[AUTONOMY: HIGH] Work confidently and autonomously. Build complete, polished solutions. Report what was done.",
        max:    "\n\n[AUTONOMY: MAX] Full autonomy. Create comprehensive, production-quality apps with multiple files, animations, and full functionality. Push beyond the request to deliver excellence.",
      }[autonomyLevel];
      const buildHint = buildMode === "full"
        ? "\n\n[BUILD: FULL] Perform a complete build — optimize all files, ensure perfect code quality, add error handling, polish the UI, and make it production-ready."
        : "\n\n[BUILD: FAST] Quick build — focus on functionality first, keep it clean and working.";

      const body: Record<string, unknown> = {
        system: AI_SYSTEM + autonomyHint + buildHint,
        messages: [...histMsgs, { role: "user", content: prompt + fileCtx }],
        mode: aiMode,
      };
      if (img) { body.image = img.base64; body.imageMime = img.mime; }

      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = "";
      let firstChunk = true;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text } = JSON.parse(line.slice(6));
                if (text) {
                  if (firstChunk) { setAgentPhase("coding"); firstChunk = false; }
                  acc += text;
                  // Show current file being written
                  const openMatches = acc.match(/\[FILE:([^\]]+)\]/g) ?? [];
                  const closedCount = (acc.match(/\[\/FILE\]/g) ?? []).length;
                  const currentFile = openMatches.length > closedCount
                    ? openMatches[openMatches.length - 1].replace("[FILE:", "").replace("]", "")
                    : null;
                  const display = acc.replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, "").trim();
                  setStreamingText(display || (currentFile
                    ? `📝 ${currentFile} 작성 중... (${closedCount}개 완료)`
                    : "⚙️ 코드 생성 중..."));
                }
              } catch {}
            }
          }
        }
      }
      setAgentPhase("reviewing");

      setStreamingText("");
      setAgentPhase(null);
      const parsed = parseAiFiles(acc);

      if (Object.keys(parsed).length > 0) {
        const updated = { ...filesRef.current };
        const changed: string[] = [];
        for (const [fname, content] of Object.entries(parsed)) {
          updated[fname] = { name: fname, language: extToLang(fname), content };
          changed.push(fname);
        }
        setFiles(updated);
        setChangedFiles(changed);
        setTimeout(() => setChangedFiles([]), 3000); // 3초 후 변경 표시 제거
        setOpenTabs(p => {
          const next = [...p];
          for (const fname of changed) if (!next.includes(fname)) next.push(fname);
          return next;
        });
        setTimeout(() => {
          let html = buildPreview(updated);
          if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
          setPreviewSrc(injectConsoleCapture(html));
          setIframeKey(k => k + 1);
          setHasRun(true);
          setLogs([]); setErrorCount(0);
        }, 100);
        // 코드 생성 완료 후 자동 테스트 실행 (프리뷰 로드 대기 후)
        setTimeout(() => autoTest(), 2200);
        const fileList = changed.map(f => `\`${f}\``).join(", ");
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `✅ ${fileList} 생성/수정 완료.\n\n되돌리려면 상단 [↩ 되돌리기] 버튼을 클릭하세요.`,
          ts: nowTs(),
        }]);
      } else {
        const clean = acc.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
        // 429 / 할당량 초과 에러 감지 → 모델 전환 안내
        if (clean.includes("429") || clean.includes("insufficient_quota") || clean.includes("quota") || clean.includes("스타터 플랜") || clean.includes("한도")) {
          setShowUpgradeModal(true);
        } else {
          setAiMsgs(p => [...p, { role: "agent", text: clean || "응답을 받지 못했습니다.", ts: nowTs() }]);
        }
      }
    } catch (err: unknown) {
      setStreamingText("");
      setAgentPhase(null);
      if ((err as Error)?.name !== "AbortError") {
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 오류: ${(err as Error)?.message || "연결 실패"}\n\n🔑 /settings에서 API 키를 확인하거나, 아래 버튼으로 재시도해주세요.\n[RETRY:${prompt}]`,
          ts: nowTs(),
        }]);
      }
    }
    setAiLoading(false);
  };

  const autoFixErrors = () => {
    const errs = logs.filter(l => l.level === "error").map(l => l.msg).join("\n");
    const code = Object.entries(filesRef.current).map(([n, f]) => `${n}:\n${f.content}`).join("\n\n---\n\n");
    runAI(`다음 에러를 수정해줘:\n${errs}\n\n현재 코드:\n${code}`);
    setLeftTab("ai");
  };

  const handleAiSend = () => {
    const t = aiInput.trim();
    if (!t || aiLoading) return;
    setAiInput("");
    runAI(t);
  };

  // Share
  const shareProject = () => {
    const html = buildPreview(files);
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

  // Publish — real /p/[slug] URL via server
  const publishProject = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const html = injectConsoleCapture(buildPreview(filesRef.current));
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
  const newProject = () => {
    const id = genId();
    const f = { ...DEFAULT_FILES };
    saveProjectToStorage({ id, name: "새 프로젝트", files: f, updatedAt: new Date().toISOString() });
    localStorage.setItem(CUR_KEY, id);
    setProjectId(id);
    setFiles(f);
    setProjectName("새 프로젝트");
    setOpenTabs(["index.html", "style.css", "script.js"]);
    setHistory([]);
    setShowProjects(false);
    showToast("🆕 새 프로젝트");
  };

  const deleteProject = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`"${proj.name}" 프로젝트를 삭제하시겠습니까?`)) return;
    const all = loadProjects().filter(p => p.id !== proj.id);
    localStorage.setItem(PROJ_KEY, JSON.stringify(all));
    setProjects(all);
    // Server delete (best-effort)
    fetch(`/api/projects/${proj.id}`, { method: "DELETE" }).catch(() => {});
    // If deleting active project, create new
    if (proj.id === projectId) newProject();
    else showToast(`🗑 "${proj.name}" 삭제됨`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); revertHistory(); }
      if (e.key === "Escape") { setCtxMenu(null); setShowNewFile(false); setIsFullPreview(false); setShowCdnModal(false); setShowProjects(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [runProject, revertHistory]);

  const currentFile = files[activeFile];
  const sortedFiles = Object.keys(files).sort();
  const previewPx = previewWidth === "375" ? 375 : previewWidth === "768" ? 768 : previewWidth === "1280" ? 1280 : undefined;

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
        editingName={editingName} setEditingName={setEditingName}
        projectName={projectName} setProjectName={setProjectName}
        nameRef={nameRef}
        showProjects={showProjects} setShowProjects={setShowProjects}
        projects={projects} newProject={newProject}
        loadProject={loadProject} deleteProject={deleteProject}
        history={history} revertHistory={revertHistory}
        saving={saving}
        buildMode={buildMode} setBuildMode={setBuildMode}
        autonomyLevel={autonomyLevel} setAutonomyLevel={setAutonomyLevel}
        monthlyUsage={monthlyUsage} tokenBalance={tokenBalance}
        cdnUrls={cdnUrls} setShowCdnModal={setShowCdnModal}
        aiMode={aiMode} setAiMode={setAiMode}
        runProject={runProject} publishProject={publishProject} publishing={publishing}
        shareProject={shareProject} files={files} showToast={showToast}
      />

      {/* ══ MOBILE TAB BAR ═════════════════════════════════════════════════ */}
      {isMobile && (
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.topbar, zIndex: 20, padding: "0 8px", gap: 4 }}>
          {([["ai", "✦ AI 코드"], ["preview", "▶ 미리보기"]] as const).map(([panel, label]) => (
            <button key={panel} onClick={() => setMobilePanel(panel)}
              style={{
                flex: 1, padding: "11px 4px", fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: mobilePanel === panel ? `${T.accent}18` : "transparent",
                color: mobilePanel === panel ? T.accent : T.muted,
                borderRadius: "8px 8px 0 0",
                transition: "all 0.15s",
                borderBottom: mobilePanel === panel ? `2px solid ${T.accent}` : "2px solid transparent",
              }}>{label}</button>
          ))}
        </div>
      )}

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{
          width: isMobile ? "100%" : leftW, flexShrink: 0, display: "flex", flexDirection: "column",
          background: T.panel, borderRight: `1px solid ${T.border}`, overflow: "hidden",
          position: "relative",
          ...(isMobile && mobilePanel !== "ai" ? { display: "none" } : {}),
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.topbar }}>
            {([["files", "📁 파일"], ["ai", "✦ AI"]] as [LeftTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setLeftTab(tab)}
                style={{
                  flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 600,
                  border: "none", cursor: "pointer", fontFamily: "inherit", background: "transparent",
                  color: leftTab === tab ? T.accent : T.muted,
                  borderBottom: leftTab === tab ? `2px solid ${T.accent}` : "2px solid transparent",
                  transition: "all 0.12s",
                }}>{label}</button>
            ))}
          </div>

          {/* File list */}
          {leftTab === "files" ? (
            <WorkspaceFileTree
              sortedFiles={sortedFiles}
              activeFile={activeFile}
              changedFiles={changedFiles}
              showNewFile={showNewFile}
              setShowNewFile={setShowNewFile}
              newFileName={newFileName}
              setNewFileName={setNewFileName}
              newFileRef={newFileRef}
              openFile={openFile}
              setCtxMenu={setCtxMenu}
              createFile={createFile}
            />
          ) : (
            /* ── AI Chat ── */
            <AiChatPanel
              aiMsgs={aiMsgs}
              aiLoading={aiLoading}
              aiInput={aiInput}
              imageAtt={imageAtt}
              streamingText={streamingText}
              agentPhase={agentPhase}
              setAiMsgs={setAiMsgs}
              setAiInput={setAiInput}
              setImageAtt={setImageAtt}
              handleAiSend={handleAiSend}
              handleDrop={handleDrop}
              handlePaste={handlePaste}
              handleImageFile={handleImageFile}
              toggleVoice={toggleVoice}
              runAI={runAI}
              showToast={showToast}
              aiEndRef={aiEndRef}
              fileInputRef={fileInputRef}
              abortRef={abortRef}
              filesRef={filesRef}
              isRecording={isRecording}
              router={router}
            />
          )}

          {/* Drag handle */}
          <div onMouseDown={startDragLeft}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", zIndex: 10, background: draggingLeft ? T.borderHi : "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = T.border)}
            onMouseLeave={e => { if (!draggingLeft) e.currentTarget.style.background = "transparent"; }}
          />
        </div>

        {/* ── CENTER: Editor + Console ──────────────────────────────────── */}
        <div style={{ flex: 1, display: isMobile ? "none" : "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* File tabs */}
          <div style={{ display: "flex", alignItems: "center", background: T.topbar, borderBottom: `1px solid ${T.border}`, flexShrink: 0, overflowX: "auto" }}>
            {openTabs.filter(t => files[t]).map(name => (
              <div key={name} onClick={() => setActiveFile(name)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", cursor: "pointer", flexShrink: 0,
                  borderRight: `1px solid ${T.border}`,
                  background: activeFile === name ? T.panel : "transparent",
                  borderBottom: activeFile === name ? `2px solid ${T.accent}` : "2px solid transparent",
                  color: activeFile === name ? T.text : T.muted,
                  fontSize: 12, fontWeight: activeFile === name ? 600 : 400,
                  transition: "all 0.1s", position: "relative",
                }}>
                <span style={{ fontSize: 11 }}>{fileIcon(name)}</span>
                <span>{name}</span>
                {changedFiles.includes(name) && (
                  <span style={{ position: "absolute", top: 7, right: 20, width: 5, height: 5, borderRadius: "50%", background: T.accent }}/>
                )}
                <span onClick={e => closeTab(name, e)}
                  style={{ fontSize: 14, color: T.muted, lineHeight: 1, padding: "0 2px", borderRadius: 3, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>×</span>
              </div>
            ))}
            <button onClick={() => setShowNewFile(true)}
              style={{ padding: "8px 12px", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
              title="새 파일">+</button>
          </div>

          {/* Monaco + Textarea fallback */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {currentFile ? (
              <>
                {/* Textarea: immediately functional while Monaco loads; permanent on mobile */}
                {(!monacoLoaded || isMobile) && (
                  <textarea
                    value={currentFile.content}
                    onChange={e => updateFileContent(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        const s = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const val = e.currentTarget.value;
                        const next = val.substring(0, s) + "  " + val.substring(end);
                        e.currentTarget.value = next;
                        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2;
                        updateFileContent(next);
                      }
                    }}
                    spellCheck={false}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      background: "#1e1e1e", color: "#d4d8e2",
                      fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                      fontSize: 13, lineHeight: 1.6, padding: "10px 14px",
                      border: "none", outline: "none", resize: "none",
                      tabSize: 2, zIndex: 2, boxSizing: "border-box",
                    }}
                  />
                )}
                {/* Monaco loads in background, fades in when ready; skipped on mobile */}
                {!isMobile && (
                  <div style={{ position: "absolute", inset: 0, opacity: monacoLoaded ? 1 : 0, transition: "opacity 0.2s" }}>
                    <MonacoEditor
                      height="100%"
                      language={currentFile.language}
                      theme="vs-dark"
                      value={currentFile.content}
                      onChange={v => updateFileContent(v ?? "")}
                      onMount={() => setMonacoLoaded(true)}
                      options={{
                        fontSize: 13,
                        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        lineNumbers: "on",
                        renderLineHighlight: "all",
                        automaticLayout: true,
                        tabSize: 2,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        formatOnPaste: true,
                        suggestOnTriggerCharacters: true,
                        padding: { top: 10 },
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.muted }}>
                <div style={{ fontSize: 32 }}>📄</div>
                <div style={{ fontSize: 13 }}>파일을 선택하거나 새로 만드세요</div>
              </div>
            )}
          </div>

          {/* Console */}
          <ConsolePanel
            logs={logs}
            errorCount={errorCount}
            showConsole={showConsole}
            consoleH={consoleH}
            autoFixCountdown={autoFixCountdown}
            setShowConsole={setShowConsole}
            setLogs={setLogs}
            setErrorCount={setErrorCount}
            setAutoFixCountdown={setAutoFixCountdown}
            autoFixErrors={autoFixErrors}
            runAI={runAI}
            autoFixTimerRef={autoFixTimerRef}
            setLeftTab={setLeftTab}
            onDragStart={startDragConsole}
            isDragging={draggingConsole}
          />
        </div>

        {/* Drag handle right */}
        <DragHandle direction="horizontal" onMouseDown={startDragRight} isDragging={draggingRight} />

        {/* ── RIGHT: Preview ──────────────────────────────────────────── */}
        <div style={{
          width: isMobile ? "100%" : rightW, flexShrink: 0, display: isMobile && mobilePanel !== "preview" ? "none" : "flex", flexDirection: "column",
          background: T.panel, overflow: "hidden",
          ...(isFullPreview ? { position: "fixed", inset: 0, zIndex: 50, width: "100%", height: "100%" } : {}),
        }}>
          {/* Preview header */}
          <PreviewHeaderToolbar
            previewWidth={previewWidth}
            previewRefreshing={previewRefreshing}
            hasRun={hasRun}
            projectName={projectName}
            autoTesting={autoTesting}
            isFullPreview={isFullPreview}
            setPreviewWidth={setPreviewWidth}
            setIsFullPreview={setIsFullPreview}
            runProject={runProject}
            autoTest={autoTest}
          />

          {/* Iframe container with responsive width */}
          <div style={{
            flex: 1, overflow: "auto",
            background: previewWidth !== "full" ? "#111118" : "#fff",
            display: "flex", justifyContent: "center", alignItems: previewWidth !== "full" ? "flex-start" : "stretch",
          }}>
            <div style={{
              width: previewPx ?? "100%",
              minHeight: "100%",
              background: "#fff",
              boxShadow: previewWidth !== "full" ? "0 0 60px rgba(0,0,0,0.6)" : "none",
              flexShrink: 0,
            }}>
              <iframe
                key={iframeKey}
                srcDoc={previewSrc}
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                style={{ width: "100%", height: previewPx ? "100vh" : "100%", border: "none", display: "block" }}
                title="앱 미리보기"
              />
            </div>
          </div>
        </div>
      </div>

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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
          onClick={() => setShowUpgradeModal(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 24, padding: "36px 32px", width: 520, maxWidth: "90vw", boxShadow: "0 40px 100px rgba(0,0,0,0.9)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: "0 0 8px" }}>AI 한도에 도달했습니다</h2>
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
                  style={{ background: plan.popular ? `${T.accent}15` : "rgba(255,255,255,0.03)", border: `2px solid ${plan.popular ? T.borderHi : T.border}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", transition: "all 0.15s" }}
                  onClick={() => { window.open("/pricing", "_blank"); setShowUpgradeModal(false); }}>
                  {plan.popular && <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 8, letterSpacing: "0.05em" }}>✦ 가장 인기</div>}
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 11, color: T.muted }}> / 월</span></div>
                  <div style={{ fontSize: 11, color: T.muted }}>AI {plan.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
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

      {/* Context menu */}
      {ctxMenu && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", zIndex: 200, overflow: "hidden", minWidth: 140 }}>
          {[
            { label: "파일 열기", action: () => { openFile(ctxMenu.file); setCtxMenu(null); } },
            { label: "삭제", action: () => deleteFile(ctxMenu.file), danger: true },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", textAlign: "left", color: (item as { danger?: boolean }).danger ? T.red : T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >{item.label}</button>
          ))}
        </div>
      )}

      {/* Toast */}
      <WorkspaceToast message={toast || null} />

      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,6px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{opacity:0.85;box-shadow:0 0 0 4px rgba(239,68,68,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
        textarea::placeholder { color: #3a3d52; }
        select option { background: #0b0b14; color: #d4d8e2; }
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
