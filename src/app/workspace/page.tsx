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
  const s = `<script>(function(){var p=function(d){try{window.parent.postMessage(Object.assign({type:'F9IDE'},d),'*')}catch(e){}};
window.onerror=function(m,_,l,c,e){p({level:'error',msg:(e&&e.message)||m+' (line '+l+')'});return false};
window.addEventListener('unhandledrejection',function(e){p({level:'error',msg:'Promise: '+(e.reason?.message||e.reason||e)})});
['log','warn','error','info'].forEach(function(k){var o=console[k];console[k]=function(){
var s=Array.prototype.slice.call(arguments).map(function(a){return typeof a==='object'?JSON.stringify(a):String(a)}).join(' ');
p({level:k,msg:s});o.apply(console,arguments)};});})()</script>`;
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
  // Fallback: ``` blocks
  const fence = /```(\w+)?\s*\n([\s\S]*?)```/g;
  const used = new Set<string>();
  while ((m = fence.exec(text)) !== null) {
    const lang = (m[1] || "js").toLowerCase();
    const content = m[2].trim();
    const fname = lang === "html" ? "index.html" : lang === "css" ? "style.css" : lang === "javascript" || lang === "js" ? "script.js" : lang === "typescript" || lang === "ts" ? "script.ts" : `file.${lang}`;
    const key = used.has(fname) ? `${fname.replace(/\.\w+$/, "")}_${used.size}${fname.slice(fname.lastIndexOf("."))}` : fname;
    used.add(key);
    result[key] = content;
  }
  return result;
}

function nowTs() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function logColor(l: LogLevel) {
  return l === "error" ? T.red : l === "warn" ? T.warn : l === "info" ? T.info : "#7a8098";
}

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
function genId() { return Math.random().toString(36).slice(2, 10); }

// ── AI System Prompt ────────────────────────────────────────────────────────────
const AI_SYSTEM = `You are an elite senior web developer inside FieldNine IDE.
You build stunning, production-quality web apps using HTML, CSS, JavaScript.

## MANDATORY OUTPUT FORMAT
- ALWAYS wrap every file in [FILE:filename.ext] ... [/FILE]
- Return COMPLETE file content — never truncate, never say "// rest of code"
- Output ALL changed files even if only one line differs
- No explanation text before/after FILE blocks — just the files

## QUALITY STANDARDS
- Zero bugs, zero SyntaxErrors — test mentally before outputting
- Modern ES6+: const/let, arrow functions, template literals, async/await
- Luxurious UI: animations, glassmorphism, gradients, perfect spacing
- Fully responsive (320px mobile to 4K desktop)
- All features must WORK — no placeholder functions

## CRITICAL PROHIBITIONS
- NEVER use jQuery ($) or any undeclared library
- NEVER create loading states that never resolve
- NEVER fetch external APIs (use hardcoded/generated data)
- NEVER use setTimeout > 500ms visible to user
- NEVER use document.write()
- NEVER leave Promises dangling

## ERROR FIXING
When fixing errors: identify cause → return corrected COMPLETE file(s) → add // FIXED: comment

## FILE FORMAT
[FILE:index.html]
<!DOCTYPE html><html lang="ko">...complete...</html>
[/FILE]
[FILE:style.css]
/* complete css */
[/FILE]
[FILE:script.js]
// complete javascript
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
  const [aiMsgs, setAiMsgs] = useState<AiMsg[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState("openai");
  const [streamingText, setStreamingText] = useState("");
  const [imageAtt, setImageAtt] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [changedFiles, setChangedFiles] = useState<string[]>([]);

  // UI
  const [editingName, setEditingName] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; file: string } | null>(null);
  const [toast, setToast] = useState("");
  const [draggingLeft, setDraggingLeft] = useState(false);
  const [draggingRight, setDraggingRight] = useState(false);
  const [draggingConsole, setDraggingConsole] = useState(false);

  // Refs
  const abortRef = useRef<AbortController | null>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoRunTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filesRef = useRef(files);
  const cdnRef = useRef(cdnUrls);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { cdnRef.current = cdnUrls; }, [cdnUrls]);

  // Load project on mount
  useEffect(() => {
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
    setProjects(loadProjects());
    // eslint-disable-next-line
  }, []);

  // Auto-save
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const proj: Project = { id: projectId, name: projectName, files: filesRef.current, updatedAt: new Date().toISOString() };
      saveProjectToStorage(proj);
      localStorage.setItem(CUR_KEY, projectId);
      setProjects(loadProjects());
    }, 1500);
  }, [files, projectName, projectId]);

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
      let html = buildPreview(filesRef.current);
      if (cdnRef.current.length > 0) html = injectCdns(html, cdnRef.current);
      setPreviewSrc(injectConsoleCapture(html));
      setIframeKey(k => k + 1);
      setPreviewRefreshing(false);
    }, 900);
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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"));
    if (f) handleImageFile(f);
  };

  // AI
  const runAI = async (prompt: string, _isFirst = false) => {
    if (aiLoading) return;
    setAiLoading(true);
    setStreamingText("");
    const img = imageAtt;
    setImageAtt(null);
    setAiMsgs(p => [...p, { role: "user", text: prompt, ts: nowTs(), image: img?.preview }]);

    try {
      abortRef.current = new AbortController();
      pushHistory("AI 생성 전");

      const needsCtx = /error|fix|수정|고쳐|bug|안돼|않아|문제|오류|syntax|작동|실행/i.test(prompt);
      const fileCtx = needsCtx
        ? "\n\n## Current files:\n" + Object.entries(filesRef.current).map(([n, f]) => `[FILE:${n}]\n${f.content}\n[/FILE]`).join("\n")
        : "";

      const histMsgs = aiMsgs
        .filter(m => !m.image)
        .map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));

      const body: Record<string, unknown> = {
        system: AI_SYSTEM,
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
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text } = JSON.parse(line.slice(6));
                if (text) {
                  acc += text;
                  const display = acc.replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, "").trim();
                  setStreamingText(display || "⚙️ 코드 생성 중...");
                }
              } catch {}
            }
          }
        }
      }

      setStreamingText("");
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
        const fileList = changed.map(f => `\`${f}\``).join(", ");
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `✅ ${fileList} 생성/수정 완료.\n\n되돌리려면 상단 [↩ 되돌리기] 버튼을 클릭하세요.`,
          ts: nowTs(),
        }]);
      } else {
        const clean = acc.replace(/```[\w]*\n?/g, "").replace(/```/g, "").trim();
        setAiMsgs(p => [...p, { role: "agent", text: clean || "응답을 받지 못했습니다.", ts: nowTs() }]);
      }
    } catch (err: unknown) {
      setStreamingText("");
      if ((err as Error)?.name !== "AbortError") {
        setAiMsgs(p => [...p, {
          role: "agent",
          text: `⚠️ AI 오류: ${(err as Error)?.message || "연결 실패"}\n/settings에서 API 키를 확인해주세요.`,
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

  // Project ops
  const loadProject = (proj: Project) => {
    setFiles(proj.files);
    setProjectName(proj.name);
    setProjectId(proj.id);
    setOpenTabs(Object.keys(proj.files).slice(0, 5));
    localStorage.setItem(CUR_KEY, proj.id);
    setShowProjects(false);
    setHistory([]);
    showToast(`📂 ${proj.name} 로드됨`);
    setTimeout(runProject, 300);
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
                    style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{proj.name}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                      {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                    </div>
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

        <div style={{ flex: 1 }} />

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

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{
          width: leftW, flexShrink: 0, display: "flex", flexDirection: "column",
          background: T.panel, borderRight: `1px solid ${T.border}`, overflow: "hidden",
          position: "relative",
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
                    }}>{m.text}</div>
                    <span style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{m.ts}</span>
                  </div>
                ))}

                {aiLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{
                      maxWidth: "92%", padding: "9px 12px", borderRadius: "14px 14px 14px 3px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                      color: T.text, fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
                    }}>
                      {streamingText || (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: T.muted }}>생성 중</span>
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
                      position: "absolute", right: 40, bottom: 8, width: 28, height: 28, borderRadius: 7,
                      border: `1px solid ${imageAtt ? T.accent : T.border}`,
                      background: imageAtt ? `${T.accent}20` : "rgba(255,255,255,0.06)",
                      color: imageAtt ? T.accent : T.muted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="2" width="10" height="8" rx="1.5"/><circle cx="4" cy="5" r="1"/><path d="M1 9l3-3 2 2 2-3 3 4"/>
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
                <div style={{ fontSize: 9.5, color: T.muted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>Enter 전송 · 이미지 드래그/Ctrl+V</span>
                  {aiLoading && (
                    <button onClick={() => abortRef.current?.abort()}
                      style={{ background: "none", border: "none", color: T.red, fontSize: 9.5, cursor: "pointer", fontFamily: "inherit" }}>✕ 중단</button>
                  )}
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
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

          {/* Monaco */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {currentFile ? (
              <MonacoEditor
                height="100%"
                language={currentFile.language}
                theme="vs-dark"
                value={currentFile.content}
                onChange={v => updateFileContent(v ?? "")}
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
                  <button onClick={e => { e.stopPropagation(); autoFixErrors(); }}
                    style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                    ✦ AI 자동 수정
                  </button>
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
                    <div key={i} style={{ display: "flex", gap: 10, borderLeft: l.level === "error" ? `2px solid ${T.red}` : l.level === "warn" ? `2px solid ${T.warn}` : "2px solid transparent", paddingLeft: 6, marginBottom: 1 }}>
                      <span style={{ color: T.muted, flexShrink: 0, fontSize: 9.5 }}>{l.ts}</span>
                      <span style={{ color: logColor(l.level) }}>{l.msg}</span>
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
          width: rightW, flexShrink: 0, display: "flex", flexDirection: "column",
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
                    onKeyDown={e => { if (e.key === "Enter" && customCdn.trim()) { setCdnUrls(p => [...p, customCdn.trim()]); setCustomCdn(""); } }}
                    placeholder="https://cdn.jsdelivr.net/..."
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
                  />
                  <button onClick={() => { if (customCdn.trim()) { setCdnUrls(p => [...p, customCdn.trim()]); setCustomCdn(""); } }}
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
