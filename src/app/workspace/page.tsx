"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────
type Lang = "html" | "css" | "javascript" | "typescript" | "python" | "json" | "markdown";
type FileNode = { name: string; language: Lang; content: string };
type FilesMap = Record<string, FileNode>;
type LeftTab = "files" | "ai";
type LogLevel = "log" | "warn" | "error" | "info";
type LogEntry = { level: LogLevel; msg: string; ts: string };
type AiMsg = { role: "user" | "agent"; text: string; ts: string; image?: string };
type HistoryEntry = { files: FilesMap; ts: string; label: string };
type Project = { id: string; name: string; files: FilesMap; updatedAt: string };
type PreviewWidth = "full" | "375" | "768" | "1280";
type CdnPkg = { name: string; label: string; url: string };

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#050508",
  panel:    "#0b0b14",
  surface:  "#0f0f1a",
  topbar:   "#06060d",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(249,115,22,0.45)",
  text:     "#d4d8e2",
  muted:    "#4a5066",
  accent:   "#f97316",
  accentB:  "#f43f5e",
  green:    "#22c55e",
  red:      "#f87171",
  warn:     "#fb923c",
  info:     "#60a5fa",
};

// ── CDN Packages ───────────────────────────────────────────────────────────────
const CDN_PKGS: CdnPkg[] = [
  { name: "chart.js",  label: "Chart.js",  url: "https://cdn.jsdelivr.net/npm/chart.js" },
  { name: "three",     label: "Three.js",  url: "https://cdn.jsdelivr.net/npm/three@0.160/build/three.min.js" },
  { name: "gsap",      label: "GSAP",      url: "https://cdn.jsdelivr.net/npm/gsap@3.12/dist/gsap.min.js" },
  { name: "d3",        label: "D3.js",     url: "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js" },
  { name: "anime",     label: "Anime.js",  url: "https://cdn.jsdelivr.net/npm/animejs@3.2/lib/anime.min.js" },
  { name: "confetti",  label: "Confetti",  url: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9/dist/confetti.browser.min.js" },
  { name: "axios",     label: "Axios",     url: "https://cdn.jsdelivr.net/npm/axios@1.6/dist/axios.min.js" },
  { name: "lodash",    label: "Lodash",    url: "https://cdn.jsdelivr.net/npm/lodash@4.17/lodash.min.js" },
  { name: "dayjs",     label: "Day.js",    url: "https://cdn.jsdelivr.net/npm/dayjs@1.11/dayjs.min.js" },
  { name: "pixi",      label: "PixiJS",    url: "https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js" },
];

// ── Default files ──────────────────────────────────────────────────────────────
const DEFAULT_FILES: FilesMap = {
  "index.html": {
    name: "index.html", language: "html",
    content: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>내 앱</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <h1>🚀 FieldNine IDE</h1>
    <p>왼쪽 AI 패널에서 만들고 싶은 앱을 입력해보세요.</p>
    <button onclick="greet()">인사하기</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  },
  "style.css": {
    name: "style.css", language: "css",
    content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, sans-serif;
  background: linear-gradient(135deg, #0f0f11 0%, #1a1a2e 100%);
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.container {
  text-align: center; padding: 48px 40px;
  background: rgba(255,255,255,0.04);
  border-radius: 24px; border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(20px); max-width: 480px; width: 90%;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
}
h1 { font-size: 2rem; font-weight: 800; margin-bottom: 14px; }
p  { color: rgba(255,255,255,0.5); margin-bottom: 28px; line-height: 1.7; }
button {
  background: linear-gradient(135deg, #f97316, #f43f5e);
  color: #fff; border: none; padding: 13px 32px;
  border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 24px rgba(249,115,22,0.4);
}
button:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(249,115,22,0.5); }
#output { margin-top: 22px; font-size: 18px; font-weight: 600; color: #f97316; }`,
  },
  "script.js": {
    name: "script.js", language: "javascript",
    content: `function greet() {
  const names = ["세계", "FieldNine", "개발자님"];
  const pick = names[Math.floor(Math.random() * names.length)];
  document.getElementById("output").textContent = "안녕하세요, " + pick + "! 👋";
  console.log("greet() →", pick);
}
console.log("✅ script.js 로드 완료");`,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const LANG_MAP: Record<string, Lang> = {
  html:"html", css:"css", js:"javascript", ts:"typescript",
  py:"python", json:"json", md:"markdown",
};
function extToLang(filename: string): Lang {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return LANG_MAP[ext] ?? "javascript";
}
const FILE_ICONS: Record<string, string> = {
  html:"🌐", css:"🎨", js:"⚡", ts:"🔷", py:"🐍", json:"📋", md:"📝", txt:"📄",
};
function fileIcon(n: string) { return FILE_ICONS[n.split(".").pop()?.toLowerCase() ?? ""] ?? "📄"; }

function buildPreview(files: FilesMap): string {
  const htmlFile = files["index.html"];
  if (!htmlFile) return "<body style='color:#fff;background:#050508;padding:20px;font-family:sans-serif'><h2>index.html 없음</h2></body>";
  let html = htmlFile.content;
  for (const [fname, f] of Object.entries(files)) {
    if (f.language === "css") {
      html = html.replace(new RegExp(`<link[^>]+href=["']${fname}["'][^>]*>`, "gi"), `<style>${f.content}</style>`);
    }
  }
  for (const [fname, f] of Object.entries(files)) {
    if (f.language === "javascript") {
      html = html.replace(new RegExp(`<script[^>]+src=["']${fname}["'][^>]*><\\/script>`, "gi"), `<script>${f.content}</script>`);
    }
  }
  return html;
}

function injectConsoleCapture(html: string): string {
  const s = `<script>(function(){
var p=function(d){try{window.parent.postMessage(Object.assign({type:'F9IDE'},d),'*')}catch(e){}};
window.onerror=function(m,_,l,c,e){p({level:'error',msg:(e&&e.message)||m+' (line '+l+')'});return false};
window.addEventListener('unhandledrejection',function(e){p({level:'error',msg:'Promise: '+(e.reason?.message||e.reason||e)})});
['log','warn','error','info'].forEach(function(k){var o=console[k];console[k]=function(){
var s=Array.prototype.slice.call(arguments).map(function(a){return typeof a==='object'?JSON.stringify(a):String(a)}).join(' ');
p({level:k,msg:s});o.apply(console,arguments)};});
/* 깨진 이미지 자동 처리 */
function fixImg(img){
  var apply=function(){
    img.style.cssText='display:inline-block;min-width:80px;min-height:60px;background:#f0f2f5;border-radius:8px;border:2px dashed #d1d5db;vertical-align:middle;box-sizing:border-box;';
    img.title=img.alt||'이미지';img.onerror=null;
  };
  img.onerror=apply;
  if(img.complete&&img.src&&!img.naturalWidth)apply();
}
function initImgFix(){document.querySelectorAll('img').forEach(fixImg);}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initImgFix);}else{initImgFix();}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(!n||n.nodeType!==1)return;if(n.tagName==='IMG')fixImg(n);if(n.querySelectorAll)n.querySelectorAll('img').forEach(fixImg);});});}).observe(document.documentElement,{childList:true,subtree:true});
})()</script>`;
  if (html.includes("<head>")) return html.replace("<head>", "<head>" + s);
  if (html.includes("<body>")) return html.replace("<body>", "<body>" + s);
  return s + html;
}

function injectCdns(html: string, urls: string[]): string {
  const tags = urls.map(u => `<script src="${u}"></script>`).join("\n");
  if (html.includes("</head>")) return html.replace("</head>", `${tags}\n</head>`);
  return tags + "\n" + html;
}

/** Parse AI response: [FILE:name]...[/FILE] first, then ```lang``` fallback */
function parseAiFiles(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let m;
  while ((m = re.exec(text)) !== null) result[m[1].trim()] = m[2].trim();
  if (Object.keys(result).length > 0) return result;
  // Fallback: ``` blocks — keep longest (most complete) version per filename
  const fence = /```(\w+)?\s*\n([\s\S]*?)```/g;
  while ((m = fence.exec(text)) !== null) {
    const lang = (m[1] || "js").toLowerCase();
    const content = m[2].trim();
    const fname = lang === "html" ? "index.html" : lang === "css" ? "style.css" : lang === "javascript" || lang === "js" ? "script.js" : lang === "typescript" || lang === "ts" ? "script.ts" : `file.${lang}`;
    if (!result[fname] || content.length > result[fname].length) {
      result[fname] = content;
    }
  }
  return result;
}

function nowTs() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function logColor(l: LogLevel) {
  return l === "error" ? T.red : l === "warn" ? T.warn : l === "info" ? T.info : "#7a8098";
}

// ── Token helpers ──────────────────────────────────────────────────────────────
const TOK_KEY = "f9_tokens_v1";
const TOK_INIT = 50000; // 50,000 tokens = $50 free
function getTokens(): number {
  try { const v = localStorage.getItem(TOK_KEY); return v ? parseInt(v) : TOK_INIT; } catch { return TOK_INIT; }
}
function setTokenStore(n: number) {
  try { localStorage.setItem(TOK_KEY, String(Math.max(0, n))); } catch {}
}
function calcCost(prompt: string): number {
  const l = prompt.length;
  if (l < 300) return 50;     // $0.05
  if (l < 1500) return 1250;  // $1.25
  return 5950;                 // $5.95
}
function tokToUSD(t: number): string { return `$${(t / 1000).toFixed(2)}`; }

// ── Compress (publish URL) ─────────────────────────────────────────────────────
async function compressHtml(str: string): Promise<string> {
  const bytes = new TextEncoder().encode(str);
  const cs = new CompressionStream("deflate-raw");
  const w = cs.writable.getWriter();
  w.write(bytes); w.close();
  const r = cs.readable.getReader();
  const parts: Uint8Array[] = [];
  for (;;) { const { done, value } = await r.read(); if (done) break; parts.push(value!); }
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len); let off = 0;
  parts.forEach(p => { out.set(p, off); off += p.length; });
  let bin = ""; const CHUNK = 0x8000;
  for (let i = 0; i < out.length; i += CHUNK) bin += String.fromCharCode(...Array.from(out.subarray(i, i + CHUNK)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── AI chat history ────────────────────────────────────────────────────────────
const AI_HIST_KEY = "f9_ai_hist_v1";

// ── Project storage ────────────────────────────────────────────────────────────
const PROJ_KEY = "f9_projects_v3";
const CUR_KEY  = "f9_cur_proj";

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
      <div style={{
        height: 46, display: "flex", alignItems: "center", flexShrink: 0,
        background: T.topbar, borderBottom: `1px solid ${T.border}`,
        padding: "0 10px", gap: 6, zIndex: 30,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03)",
      }}>
        {/* Logo */}
        <div onClick={() => router.push("/")} style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0, cursor: "pointer",
          background: `linear-gradient(135deg,${T.accent},${T.accentB})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 10, color: "#fff",
          boxShadow: "0 2px 12px rgba(249,115,22,0.3)",
        }}>F9</div>

        <div style={{ width: 1, height: 16, background: T.border }} />

        {/* Project name + switcher */}
        <div style={{ position: "relative" }}>
          {editingName ? (
            <input ref={nameRef} value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
              style={{
                fontSize: 12, fontWeight: 700, color: T.text,
                background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
                borderRadius: 6, padding: "3px 10px", outline: "none",
                fontFamily: "inherit", width: 170,
              }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span onClick={() => setEditingName(true)} style={{
                fontSize: 12, fontWeight: 700, color: T.text, cursor: "text",
                padding: "3px 6px", borderRadius: 6,
                maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{projectName}</span>
              <button onClick={e => { e.stopPropagation(); setShowProjects(v => !v); }}
                style={{
                  padding: "2px 5px", borderRadius: 5, border: `1px solid ${T.border}`,
                  background: "rgba(255,255,255,0.04)", color: T.muted,
                  cursor: "pointer", fontSize: 9, fontFamily: "inherit",
                }}>▾</button>
            </div>
          )}
          {/* Project dropdown */}
          {showProjects && (
            <div onClick={e => e.stopPropagation()}
              style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                zIndex: 300, minWidth: 230, overflow: "hidden",
              }}
            >
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
                <button onClick={newProject}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: 8,
                    background: `${T.accent}18`, border: `1px solid ${T.borderHi}`,
                    color: T.accent, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>+ 새 프로젝트</button>
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {projects.map(proj => (
                  <div key={proj.id} onClick={() => loadProject(proj)}
                    style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                        {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                    <button onClick={e => deleteProject(proj, e)} title="삭제"
                      style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                    >✕</button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div style={{ padding: "12px", fontSize: 11, color: T.muted, textAlign: "center" }}>저장된 프로젝트 없음</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Undo */}
        {history.length > 0 && (
          <button onClick={revertHistory} title="되돌리기 (Ctrl+Z)"
            style={{
              padding: "4px 9px", borderRadius: 7, border: `1px solid ${T.border}`,
              background: "rgba(255,255,255,0.04)", color: T.muted,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>↩</button>
        )}

        {/* Save indicator */}
        {saving !== "idle" && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
            {saving === "saving" ? (
              <>
                <div style={{ width: 8, height: 8, border: `1.5px solid ${T.muted}`, borderTopColor: T.green, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: T.muted }}>저장 중...</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 10 }}>✓</span>
                <span style={{ fontSize: 10, color: T.green }}>저장됨</span>
              </>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Build mode toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 7, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {(["fast", "full"] as const).map(mode => (
            <button key={mode} onClick={() => setBuildMode(mode)}
              title={mode === "fast" ? "빠른 빌드: 빠른 결과 우선" : "전체 빌드: 완성도 최우선"}
              style={{
                padding: "4px 9px", border: "none", fontSize: 10, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                background: buildMode === mode ? (mode === "full" ? `${T.accent}30` : "rgba(255,255,255,0.08)") : "transparent",
                color: buildMode === mode ? (mode === "full" ? T.accent : T.text) : T.muted,
              }}>
              {mode === "fast" ? "⚡빠른" : "🔨전체"}
            </button>
          ))}
        </div>

        {/* Autonomy level */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>자율성</span>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 7, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {([
              { id: "low" as const,    label: "Low",  color: "#60a5fa" },
              { id: "medium" as const, label: "Mid",  color: "#a78bfa" },
              { id: "high" as const,   label: "High", color: T.accent },
              { id: "max" as const,    label: "Max",  color: T.accentB },
            ] as const).map(a => (
              <button key={a.id} onClick={() => setAutonomyLevel(a.id)}
                title={`자율성 ${a.label}: ${a.id === "low" ? "모든 단계 확인" : a.id === "medium" ? "중요 결정만 확인" : a.id === "high" ? "완성 후 보고" : "완전 자율 실행"}`}
                style={{
                  padding: "4px 7px", border: "none", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                  background: autonomyLevel === a.id ? `${a.color}22` : "transparent",
                  color: autonomyLevel === a.id ? a.color : T.muted,
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* 월별 사용 요금 (Pro/Team) 또는 토큰 잔액 (Starter) */}
        {monthlyUsage ? (
          <div onClick={() => router.push("/pricing")} title={`이번 달 사용 요금 · 한도 ${(monthlyUsage.hard_limit/1000).toFixed(0)}천원`}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7,
              border: `1px solid ${monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? T.borderHi : T.border}`,
              background: monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? `${T.accent}18` : "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}>
            <span style={{ fontSize: 10 }}>💳</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? T.accent : T.text }}>
              {(monthlyUsage.amount_krw / 1000).toFixed(1)}천원
            </span>
            <span style={{ fontSize: 9, color: T.muted }}>/ {(monthlyUsage.hard_limit / 1000).toFixed(0)}천원</span>
            {monthlyUsage.amount_krw >= monthlyUsage.warn_threshold && (
              <span style={{ fontSize: 9, color: T.accent }}>⚠️</span>
            )}
          </div>
        ) : (
          <div onClick={() => router.push("/pricing")} title="토큰 잔액 · 클릭하여 업그레이드"
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7,
              border: `1px solid ${tokenBalance < 2000 ? T.borderHi : T.border}`,
              background: tokenBalance < 2000 ? `${T.accent}18` : "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}>
            <span style={{ fontSize: 10 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tokenBalance < 2000 ? T.accent : T.text }}>
              {tokenBalance.toLocaleString()}
            </span>
            <span style={{ fontSize: 9, color: T.muted }}>{tokToUSD(tokenBalance)}</span>
          </div>
        )}

        {/* CDN */}
        <button onClick={() => setShowCdnModal(true)} title="패키지 관리자"
          style={{
            padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`,
            background: cdnUrls.length > 0 ? `${T.accent}18` : "rgba(255,255,255,0.04)",
            color: cdnUrls.length > 0 ? T.accent : T.muted,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
          }}>
          <span>📦</span>
          {cdnUrls.length > 0 && (
            <span style={{ background: T.accent, color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 9 }}>{cdnUrls.length}</span>
          )}
        </button>

        {/* Model */}
        <select value={aiMode} onChange={e => setAiMode(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
            color: T.muted, fontSize: 11, padding: "4px 8px",
            borderRadius: 6, cursor: "pointer", outline: "none", fontFamily: "inherit",
          }}>
          <option value="openai">GPT-4o</option>
          <option value="anthropic">Claude Sonnet</option>
          <option value="gemini">Gemini 1.5</option>
          <option value="grok">Grok 3</option>
        </select>

        {/* Run */}
        <button onClick={runProject} title="실행 (Ctrl+Enter)"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8,
            background: `linear-gradient(135deg,${T.green},#16a34a)`,
            color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            boxShadow: "0 2px 14px rgba(34,197,94,0.25)",
          }}>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg>
          실행
        </button>

        {/* Publish */}
        <button onClick={publishProject} disabled={publishing} title="배포 — 공유 링크 생성"
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7,
            border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)",
            color: publishing ? T.muted : T.text, fontSize: 11,
            cursor: publishing ? "default" : "pointer", fontFamily: "inherit",
          }}>
          {publishing
            ? <div style={{ width: 10, height: 10, border: `1.5px solid ${T.muted}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <span>🚀</span>}
          {publishing ? "배포 중..." : "배포"}
        </button>

        {/* Share */}
        <button onClick={shareProject} title="공유/내보내기"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9.5" cy="2" r="1.5"/><circle cx="2" cy="6" r="1.5"/><circle cx="9.5" cy="10" r="1.5"/>
            <path d="M3.5 5.1l4.5-2.6M8 9.5L3.5 6.9"/>
          </svg>
        </button>

        {/* Download */}
        <button onClick={() => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" }));
          a.download = `${projectName}.html`; a.click(); showToast("📦 다운로드됨");
        }} title="다운로드"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1v8M3 6l3 3 3-3M1 11h10"/>
          </svg>
        </button>

        {/* Open in tab */}
        <button onClick={() => window.open(URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" })), "_blank")}
          title="새 탭에서 열기"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M6.5 1h3.5v3.5M10 1L4.5 6.5"/>
          </svg>
        </button>
      </div>

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
            <div style={{ flex: 1, overflow: "auto", padding: "6px 0" }}>
              {sortedFiles.map(name => (
                <div key={name} onClick={() => openFile(name)}
                  onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, file: name }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "5px 14px", cursor: "pointer", fontSize: 12,
                    fontWeight: activeFile === name ? 600 : 400,
                    color: activeFile === name ? T.text : T.muted,
                    background: activeFile === name ? "rgba(249,115,22,0.08)" : "transparent",
                    borderLeft: activeFile === name ? `2px solid ${T.accent}` : "2px solid transparent",
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={e => { if (activeFile !== name) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (activeFile !== name) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13 }}>{fileIcon(name)}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  {changedFiles.includes(name) && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }}/>
                  )}
                </div>
              ))}
              {showNewFile ? (
                <div style={{ padding: "6px 12px", display: "flex", gap: 4 }}>
                  <input ref={newFileRef} value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") createFile(); if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); } }}
                    placeholder="파일명.js"
                    style={{
                      flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
                      color: T.text, borderRadius: 5, padding: "4px 8px", fontSize: 11, outline: "none", fontFamily: "inherit",
                    }}
                  />
                  <button onClick={createFile}
                    style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✓</button>
                </div>
              ) : (
                <button onClick={() => setShowNewFile(true)}
                  style={{
                    margin: "6px 12px", padding: "5px 10px", borderRadius: 7,
                    border: `1px dashed ${T.border}`, background: "none", color: T.muted,
                    fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    width: "calc(100% - 24px)", display: "flex", alignItems: "center", gap: 5,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                ><span style={{ fontSize: 14 }}>+</span> 새 파일</button>
              )}
            </div>
          ) : (
            /* ── AI Chat ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {aiMsgs.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                  <button onClick={() => { setAiMsgs([]); try { localStorage.removeItem(AI_HIST_KEY); } catch {} }}
                    style={{ background: "none", border: "none", color: T.muted, fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "2px 6px", borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                    title="대화 기록 초기화">대화 초기화</button>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px 4px", display: "flex", flexDirection: "column", gap: 12 }}>
                {aiMsgs.length === 0 && !aiLoading && (
                  <div style={{ textAlign: "center", padding: "28px 12px", color: T.muted }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
                      background: `linear-gradient(135deg,${T.accent}20,${T.accentB}15)`,
                      border: `1px solid ${T.accent}30`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>✦</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>FieldNine AI</div>
                    <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.7, marginBottom: 14 }}>
                      앱을 만들거나 코드를 수정해드릴게요.<br/>이미지를 붙여넣거나 드래그하세요.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {["💎 포트폴리오 페이지 만들어줘", "📊 차트 대시보드 만들어줘", "🎮 뱀 게임 만들어줘", "🌦 날씨 앱 UI 만들어줘"].map(s => (
                        <button key={s} onClick={() => setAiInput(s.slice(2).trim())}
                          style={{
                            padding: "7px 10px", borderRadius: 8, fontSize: 11, textAlign: "left",
                            border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)",
                            color: T.muted, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                        >{s}</button>
                      ))}
                      <button onClick={() => {
                          const hasCode = Object.values(filesRef.current).some(f => f.content.length > 100 && !f.content.includes("FieldNine IDE"));
                          if (!hasCode) { showToast("⚠️ 리뷰할 코드가 없습니다"); return; }
                          const code = Object.entries(filesRef.current).map(([n, f]) => `[${n}]\n${f.content}`).join("\n\n---\n\n");
                          runAI(`다음 코드를 전문 개발자 관점에서 리뷰해줘. 버그, 성능 이슈, 보안 취약점, UX 개선점을 항목별로 한국어로 설명해줘:\n${code}`);
                        }}
                        style={{
                          padding: "7px 10px", borderRadius: 8, fontSize: 11, textAlign: "left",
                          border: `1px solid rgba(96,165,250,0.25)`, background: "rgba(96,165,250,0.06)",
                          color: "#60a5fa", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#60a5fa"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"; }}
                      >🔍 현재 코드 AI 리뷰</button>
                    </div>
                  </div>
                )}

                {aiMsgs.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                    {m.image && (
                      <img src={m.image} alt="첨부"
                        style={{ maxWidth: "90%", maxHeight: 100, borderRadius: 8, marginBottom: 4, objectFit: "cover", border: `1px solid ${T.border}` }} />
                    )}
                    <div style={{
                      maxWidth: "92%", padding: "9px 12px",
                      borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                      background: m.role === "user" ? `linear-gradient(135deg,${T.accent},${T.accentB})` : "rgba(255,255,255,0.05)",
                      border: m.role === "user" ? "none" : `1px solid ${T.border}`,
                      color: T.text, fontSize: 11.5, lineHeight: 1.65,
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {m.text.includes("[RETRY:") ? (
                        <>
                          <span>{m.text.replace(/\[RETRY:[^\]]*\]/g, "").trim()}</span>
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={() => {
                              const match = m.text.match(/\[RETRY:([^\]]*)\]/);
                              if (match) runAI(match[1]);
                            }} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              🔄 재시도
                            </button>
                            <button onClick={() => router.push("/settings")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                              ⚙️ API 설정
                            </button>
                          </div>
                        </>
                      ) : m.text}
                    </div>
                    <span style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{m.ts}</span>
                  </div>
                ))}

                {aiLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                    {/* Agent phase indicator */}
                    {!streamingText && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: "rgba(249,115,22,0.06)", border: `1px solid rgba(249,115,22,0.15)` }}>
                        {(["planning", "coding", "reviewing"] as const).map((phase, i) => {
                          const labels = { planning: "🧠 계획", coding: "⚙️ 코딩", reviewing: "✅ 검토" };
                          const isActive = agentPhase === phase;
                          const isDone = (agentPhase === "coding" && i === 0) || (agentPhase === "reviewing" && i <= 1);
                          return (
                            <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{
                                fontSize: 10, fontWeight: isActive ? 700 : 500,
                                color: isDone ? T.green : isActive ? T.accent : T.muted,
                                opacity: isActive ? 1 : isDone ? 0.9 : 0.5,
                              }}>{isDone ? "✓" : ""}{labels[phase]}</span>
                              {i < 2 && <span style={{ color: T.border, fontSize: 9 }}>›</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{
                      maxWidth: "92%", padding: "9px 12px", borderRadius: "14px 14px 14px 3px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                      color: T.text, fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
                    }}>
                      {streamingText || (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: T.muted }}>
                            {agentPhase === "planning" ? "계획 수립 중..." : agentPhase === "reviewing" ? "코드 검토 중..." : "생성 중"}
                          </span>
                          {[0,1,2].map(i => (
                            <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent, animation: `dotBounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>

              {/* Image preview strip */}
              {imageAtt && (
                <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <img src={imageAtt.preview} alt="첨부"
                    style={{ height: 44, width: 44, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.border}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>이미지 첨부됨</div>
                    <div style={{ fontSize: 9, color: T.muted }}>전송 시 AI Vision으로 분석</div>
                  </div>
                  <button onClick={() => setImageAtt(null)}
                    style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
                </div>
              )}

              {/* AI Input */}
              <div style={{ padding: "8px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
                <div style={{ position: "relative" }} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                  <textarea
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                    onPaste={handlePaste}
                    placeholder="앱이나 기능을 설명하세요... (이미지 붙여넣기 가능)"
                    disabled={aiLoading}
                    rows={3}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${T.border}`, color: T.text, borderRadius: 10,
                      padding: "9px 72px 9px 12px", fontSize: 12, fontFamily: "inherit",
                      resize: "none", outline: "none", lineHeight: 1.55, transition: "border 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = T.borderHi)}
                    onBlur={e => (e.target.style.borderColor = T.border)}
                  />
                  {/* Image attach */}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
                  <button onClick={() => fileInputRef.current?.click()} title="이미지 첨부"
                    style={{
                      position: "absolute", right: 72, bottom: 8, width: 28, height: 28, borderRadius: 7,
                      border: `1px solid ${imageAtt ? T.accent : T.border}`,
                      background: imageAtt ? `${T.accent}20` : "rgba(255,255,255,0.06)",
                      color: imageAtt ? T.accent : T.muted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="2" width="10" height="8" rx="1.5"/><circle cx="4" cy="5" r="1"/><path d="M1 9l3-3 2 2 2-3 3 4"/>
                    </svg>
                  </button>
                  {/* Voice */}
                  <button onClick={toggleVoice} title={isRecording ? "음성 입력 중지" : "음성으로 입력"}
                    style={{
                      position: "absolute", right: 40, bottom: 8, width: 28, height: 28, borderRadius: 7,
                      border: `1px solid ${isRecording ? "#ef4444" : T.border}`,
                      background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
                      color: isRecording ? "#ef4444" : T.muted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: isRecording ? "pulse 1s ease-in-out infinite" : "none",
                    }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="2" width="6" height="12" rx="3"/>
                      <path d="M5 10a7 7 0 0 0 14 0"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                      <line x1="9" y1="22" x2="15" y2="22"/>
                    </svg>
                  </button>
                  {/* Send */}
                  <button onClick={handleAiSend} disabled={!aiInput.trim() || aiLoading}
                    style={{
                      position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 7, border: "none",
                      background: aiInput.trim() && !aiLoading ? `linear-gradient(135deg,${T.accent},${T.accentB})` : "rgba(255,255,255,0.08)",
                      color: "#fff", cursor: aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
                    }}>
                    {aiLoading
                      ? <div style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
                      : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9V1M1 5l4-4 4 4"/></svg>
                    }
                  </button>
                </div>
                <div style={{ fontSize: 9.5, color: T.muted, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Enter 전송 · 이미지 드래그/Ctrl+V · 🎤 음성입력</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {aiInput.trim() && !aiLoading && (
                      <span style={{ color: T.accent, fontWeight: 600 }}>
                        ⚡ 예상 {tokToUSD(calcCost(aiInput))} 차감
                      </span>
                    )}
                    {aiLoading && (
                      <button onClick={() => abortRef.current?.abort()}
                        style={{ background: "none", border: "none", color: T.red, fontSize: 9.5, cursor: "pointer", fontFamily: "inherit" }}>✕ 중단</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.topbar }}>
            <div onMouseDown={startDragConsole}
              style={{ height: 4, cursor: "row-resize", background: draggingConsole ? T.borderHi : "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.border)}
              onMouseLeave={e => { if (!draggingConsole) e.currentTarget.style.background = "transparent"; }}
            />
            <div onClick={() => setShowConsole(v => !v)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", cursor: "pointer" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3 3.5l1.5 1.5L3 6.5M6 6.5h1.5"/>
                </svg>
                콘솔
                {errorCount > 0 && (
                  <span style={{ background: T.red, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{errorCount}</span>
                )}
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {errorCount > 0 && (
                  <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); } autoFixErrors(); }}
                    style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                    ✦ AI 자동 수정
                    {autoFixCountdown !== null && (
                      <span style={{ opacity: 0.75 }}>({autoFixCountdown}s)</span>
                    )}
                  </button>
                )}
                {autoFixCountdown !== null && (
                  <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); }}
                    style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>취소</button>
                )}
                <button onClick={e => { e.stopPropagation(); setLogs([]); setErrorCount(0); }}
                  style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>지우기</button>
                <span style={{ color: T.muted, fontSize: 12 }}>{showConsole ? "▾" : "▴"}</span>
              </div>
            </div>
            {showConsole && (
              <div style={{ height: consoleH, overflowY: "auto", padding: "2px 12px 10px", fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 11, lineHeight: 1.75 }}>
                {logs.length === 0
                  ? <div style={{ color: T.muted }}>콘솔 출력이 여기에 표시됩니다.</div>
                  : logs.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: l.level === "error" ? `2px solid ${T.red}` : l.level === "warn" ? `2px solid ${T.warn}` : "2px solid transparent", paddingLeft: 6, marginBottom: 1 }}>
                      <span style={{ color: T.muted, flexShrink: 0, fontSize: 9.5 }}>{l.ts}</span>
                      <span style={{ color: logColor(l.level), flex: 1, wordBreak: "break-all" }}>{l.msg}</span>
                      {l.level === "error" && (
                        <button onClick={e => { e.stopPropagation(); runAI(`다음 JS 에러를 찾아서 수정해줘 (에러 메시지를 기반으로 원인 파악 후 코드 수정):\n${l.msg}`); setLeftTab("ai"); }}
                          style={{ flexShrink: 0, padding: "1px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${T.red}22`, border: `1px solid ${T.red}44`, color: T.red, cursor: "pointer", fontFamily: "inherit" }}>
                          수정
                        </button>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Drag handle right */}
        <div onMouseDown={startDragRight}
          style={{ width: 4, flexShrink: 0, cursor: "col-resize", zIndex: 10, background: draggingRight ? T.borderHi : "transparent" }}
          onMouseEnter={e => (e.currentTarget.style.background = T.border)}
          onMouseLeave={e => { if (!draggingRight) e.currentTarget.style.background = "transparent"; }}
        />

        {/* ── RIGHT: Preview ──────────────────────────────────────────── */}
        <div style={{
          width: isMobile ? "100%" : rightW, flexShrink: 0, display: isMobile && mobilePanel !== "preview" ? "none" : "flex", flexDirection: "column",
          background: T.panel, overflow: "hidden",
          ...(isFullPreview ? { position: "fixed", inset: 0, zIndex: 50, width: "100%", height: "100%" } : {}),
        }}>
          {/* Preview header */}
          <div style={{ display: "flex", alignItems: "center", height: 36, background: T.topbar, borderBottom: `1px solid ${T.border}`, padding: "0 8px", gap: 5, flexShrink: 0 }}>
            {/* macOS dots */}
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f85149", cursor: "pointer" }} onClick={() => setIsFullPreview(false)}/>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f0883e" }}/>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#3fb950", cursor: "pointer" }} onClick={runProject}/>
            </div>

            <button onClick={runProject}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, padding: "2px 4px", lineHeight: 1 }}>⟳</button>

            {/* URL bar */}
            <div style={{
              flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6,
              padding: "3px 8px", fontSize: 10, color: T.muted,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 5,
              overflow: "hidden",
            }}>
              {previewRefreshing && (
                <div style={{ width: 8, height: 8, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: T.accent, borderRadius: "50%", flexShrink: 0, animation: "spin 0.8s linear infinite" }}/>
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {hasRun ? `미리보기 › ${projectName}` : "fieldnine.io"}
              </span>
            </div>

            {/* Responsive toggles */}
            {([
              ["full", "🖥", "전체"],
              ["1280", "💻", "1280"],
              ["768", "📱", "768"],
              ["375", "📱", "375"],
            ] as [PreviewWidth, string, string][]).map(([w, icon, label]) => (
              <button key={w} onClick={() => setPreviewWidth(w)} title={`${label}px`}
                style={{
                  width: 24, height: 24, borderRadius: 5, border: `1px solid ${T.border}`,
                  background: previewWidth === w ? `${T.accent}20` : "rgba(255,255,255,0.03)",
                  color: previewWidth === w ? T.accent : T.muted,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontFamily: "inherit",
                }}>{icon}</button>
            ))}

            {/* Auto Test */}
            <button onClick={autoTesting ? undefined : autoTest} title="자동 테스트 — 앱 요소를 자동 클릭"
              style={{
                width: 24, height: 24, borderRadius: 5,
                border: `1px solid ${autoTesting ? T.borderHi : T.border}`,
                background: autoTesting ? `${T.accent}20` : "rgba(255,255,255,0.03)",
                color: autoTesting ? T.accent : T.muted,
                cursor: autoTesting ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {autoTesting
                ? <div style={{ width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.3)", borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                : <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 0l8 5-8 5z"/></svg>
              }
            </button>

            {/* Fullscreen */}
            <button onClick={() => setIsFullPreview(f => !f)}
              style={{ width: 24, height: 24, borderRadius: 5, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isFullPreview
                ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3.5h2.5V1M8 3.5H5.5V1M1 5.5h2.5V8M8 5.5H5.5V8"/></svg>
                : <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3V1h2.5M5.5 1H8v2.5M8 6v2H5.5M3.5 8H1V6"/></svg>
              }
            </button>
          </div>

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
      {showCdnModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }} onClick={() => setShowCdnModal(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: 24, width: 460,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>📦 CDN 패키지 관리자</div>
              <button onClick={() => setShowCdnModal(false)}
                style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {CDN_PKGS.map(pkg => {
                  const active = cdnUrls.includes(pkg.url);
                  return (
                    <div key={pkg.name} onClick={() => setCdnUrls(p => active ? p.filter(x => x !== pkg.url) : [...p, pkg.url])}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                        border: `1px solid ${active ? T.borderHi : T.border}`,
                        background: active ? `${T.accent}10` : "rgba(255,255,255,0.02)",
                        transition: "all 0.12s",
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${active ? T.accent : T.muted}`,
                        background: active ? T.accent : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M1 4l3 3 5-6"/></svg>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{pkg.label}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>jsdelivr · {pkg.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom CDN */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>커스텀 CDN URL</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={customCdn} onChange={e => setCustomCdn(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && customCdn.trim()) {
                        const url = customCdn.trim();
                        if (!url.startsWith("https://")) { showToast("⚠️ HTTPS URL만 허용됩니다"); return; }
                        setCdnUrls(p => [...p, url]); setCustomCdn("");
                      }
                    }}
                    placeholder="https://cdn.jsdelivr.net/..."
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                  />
                  <button onClick={() => {
                    const url = customCdn.trim();
                    if (!url) return;
                    if (!url.startsWith("https://")) { showToast("⚠️ HTTPS URL만 허용됩니다"); return; }
                    setCdnUrls(p => [...p, url]); setCustomCdn("");
                  }}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>추가</button>
                </div>
                {cdnUrls.filter(u => !CDN_PKGS.map(p => p.url).includes(u)).map(url => (
                  <div key={url} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
                    <button onClick={() => setCdnUrls(p => p.filter(x => x !== url))}
                      style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { setShowCdnModal(false); runProject(); showToast(`📦 ${cdnUrls.length}개 패키지 적용`); }}
              style={{ marginTop: 16, width: "100%", padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              적용 및 실행
            </button>
          </div>
        </div>
      )}

      {/* ══ PUBLISH MODAL ══════════════════════════════════════════════════════ */}
      {/* 온보딩 모달 */}
      {showOnboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}>
          <div style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 20, padding: "36px 32px", width: 520, boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 8px" }}>FieldNine에 오신 것을 환영합니다!</h2>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              AI로 웹 앱을 몇 초 만에 만드세요.<br />코딩 지식이 없어도 됩니다.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {[
                { icon: "💬", title: "1. AI에게 요청", desc: "\"할 일 관리 앱 만들어줘\"처럼 말하세요" },
                { icon: "⚡", title: "2. 자동 생성", desc: "AI가 HTML/CSS/JS를 즉시 작성합니다" },
                { icon: "👁️", title: "3. 미리보기", desc: "오른쪽에서 실시간으로 확인하세요" },
                { icon: "🚀", title: "4. 배포 공유", desc: "링크 하나로 누구든지 접근 가능" },
              ].map(step => (
                <div key={step.title} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{step.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: `${T.accent}18`, border: `1px solid ${T.borderHi}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: T.muted }}>
              💡 <strong style={{ color: T.text }}>팁:</strong> 왼쪽 채팅창에 원하는 앱을 입력하면 바로 시작됩니다. 스타터 플랜은 하루 10회 무료!
            </div>
            <button
              onClick={() => {
                localStorage.setItem("fn_onboarded", "1");
                setShowOnboarding(false);
                setAiInput("간단한 할 일 관리 앱을 만들어줘");
              }}
              style={{ width: "100%", padding: "14px", background: T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              🚀 첫 번째 앱 만들기
            </button>
            <button
              onClick={() => { localStorage.setItem("fn_onboarded", "1"); setShowOnboarding(false); }}
              style={{ width: "100%", padding: "10px", background: "transparent", color: T.muted, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              직접 시작하기
            </button>
          </div>
        </div>
      )}

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

      {showPublishModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
          onClick={() => setShowPublishModal(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, width: 500, boxShadow: "0 28px 70px rgba(0,0,0,0.75)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>배포 완료!</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 1.7 }}>
              앱이 배포되었습니다. 아래 링크를 공유하면 누구든지 접근할 수 있습니다.<br />
              링크 안에 앱 데이터가 압축 포함되어 있어 별도 서버가 필요없습니다.
            </div>
            {/* URL */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 10, color: "#7a8098", wordBreak: "break-all", fontFamily: "monospace", maxHeight: 76, overflowY: "auto", lineHeight: 1.6 }}>
              {publishedUrl}
            </div>
            {/* Token cost notice */}
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: T.green }}>✓</span> 토큰 잔액: <strong style={{ color: T.text }}>{tokToUSD(tokenBalance)}</strong>
              <span style={{ color: T.border }}>·</span>
              AI 사용 시 $0.05 ~ $5.95 차감됩니다
            </div>
            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(publishedUrl).catch(() => {}); showToast("🔗 URL 복사됨"); }}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                🔗 링크 복사
              </button>
              <button onClick={() => window.open(publishedUrl, "_blank")}
                style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                ↗ 새 탭
              </button>
              <button onClick={() => setShowPublishModal(false)}
                style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,15,26,0.95)", color: T.text,
          padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 500,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          border: `1px solid ${T.border}`, zIndex: 9999, whiteSpace: "nowrap",
          backdropFilter: "blur(16px)", animation: "fadeUp 0.18s ease",
        }}>{toast}</div>
      )}

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
