// ── Types ──────────────────────────────────────────────────────────────────────
export type Lang = "html" | "css" | "javascript" | "typescript" | "python" | "json" | "markdown";
export type FileNode = { name: string; language: Lang; content: string };
export type FilesMap = Record<string, FileNode>;
export type LeftTab = "files" | "ai";
export type LogLevel = "log" | "warn" | "error" | "info";
export type LogEntry = { level: LogLevel; msg: string; ts: string };
export type AiMsg = { role: "user" | "agent"; text: string; ts: string; image?: string };
export type HistoryEntry = { files: FilesMap; ts: string; label: string };
export type Project = { id: string; name: string; files: FilesMap; updatedAt: string };
export type PreviewWidth = "full" | "375" | "768" | "1280";
export type CdnPkg = { name: string; label: string; url: string };

// ── Theme ──────────────────────────────────────────────────────────────────────
export const T = {
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
} as const;

// ── CDN Packages ───────────────────────────────────────────────────────────────
export const CDN_PKGS: CdnPkg[] = [
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
export const DEFAULT_FILES: FilesMap = {
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

// ── Language helpers ────────────────────────────────────────────────────────────
const LANG_MAP: Record<string, Lang> = {
  html:"html", css:"css", js:"javascript", ts:"typescript",
  py:"python", json:"json", md:"markdown",
};
export function extToLang(filename: string): Lang {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return LANG_MAP[ext] ?? "javascript";
}

const FILE_ICONS: Record<string, string> = {
  html:"🌐", css:"🎨", js:"⚡", ts:"🔷", py:"🐍", json:"📋", md:"📝", txt:"📄",
};
export function fileIcon(n: string) { return FILE_ICONS[n.split(".").pop()?.toLowerCase() ?? ""] ?? "📄"; }

// 파일명에 포함된 regex 특수문자 이스케이프
export function escRx(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── Preview builders ────────────────────────────────────────────────────────────
export function buildPreview(files: FilesMap): string {
  const htmlFile = files["index.html"];
  if (!htmlFile) return "<body style='color:#fff;background:#050508;padding:20px;font-family:sans-serif'><h2>index.html 없음</h2></body>";
  let html = htmlFile.content;
  for (const [fname, f] of Object.entries(files)) {
    if (f.language === "css") {
      html = html.replace(new RegExp(`<link[^>]+href=["']${escRx(fname)}["'][^>]*>`, "gi"), `<style>${f.content}</style>`);
    }
  }
  for (const [fname, f] of Object.entries(files)) {
    if (f.language === "javascript") {
      html = html.replace(new RegExp(`<script[^>]+src=["']${escRx(fname)}["'][^>]*><\\/script>`, "gi"), `<script>${f.content}</script>`);
    }
  }
  return html;
}

export function injectConsoleCapture(html: string): string {
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

export function injectCdns(html: string, urls: string[]): string {
  // https:// 또는 //로 시작하는 URL만 허용 (javascript: 등 방지)
  const safe = urls.filter(u => /^(https?:)?\/\//i.test(u));
  const tags = safe.map(u => `<script src="${u.replace(/"/g, '%22')}"></script>`).join("\n");
  if (html.includes("</head>")) return html.replace("</head>", `${tags}\n</head>`);
  return tags + "\n" + html;
}

// ── AI response parser ──────────────────────────────────────────────────────────
export function parseAiFiles(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let m;
  while ((m = re.exec(text)) !== null) result[m[1].trim()] = m[2].trim();
  if (Object.keys(result).length > 0) return result;
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

// ── Misc helpers ────────────────────────────────────────────────────────────────
export function nowTs() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export function logColor(l: LogLevel) {
  return l === "error" ? T.red : l === "warn" ? T.warn : l === "info" ? T.info : "#7a8098";
}

// ── Token helpers ───────────────────────────────────────────────────────────────
export const TOK_KEY  = "f9_tokens_v1";
export const TOK_INIT = 50000;

export function getTokens(): number {
  try { const v = localStorage.getItem(TOK_KEY); return v ? parseInt(v) : TOK_INIT; } catch { return TOK_INIT; }
}
export function setTokenStore(n: number) {
  try { localStorage.setItem(TOK_KEY, String(Math.max(0, n))); } catch {}
}
export function calcCost(prompt: string): number {
  const l = prompt.length;
  if (l < 300) return 50;
  if (l < 1500) return 1250;
  return 5950;
}
export function tokToUSD(t: number): string { return `$${(t / 1000).toFixed(2)}`; }

// ── Compress (publish URL) ──────────────────────────────────────────────────────
export async function compressHtml(str: string): Promise<string> {
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

// ── Storage keys ────────────────────────────────────────────────────────────────
export const AI_HIST_KEY = "f9_ai_hist_v1";
export const PROJ_KEY    = "f9_projects_v3";
export const CUR_KEY     = "f9_cur_proj";
