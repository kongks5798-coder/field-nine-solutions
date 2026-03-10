// ── Types ──────────────────────────────────────────────────────────────────────
export type Lang = "html" | "css" | "javascript" | "typescript" | "python" | "json" | "markdown";
export type FileNode = { name: string; language: Lang; content: string };
export type FilesMap = Record<string, FileNode>;
export type LeftTab = "files" | "search" | "ai" | "git" | "packages";
export type LogLevel = "log" | "warn" | "error" | "info";
export type LogEntry = { level: LogLevel; msg: string; ts: string };
export type AiMsg = { role: "user" | "agent"; text: string; ts: string; image?: string };
export type HistoryEntry = { files: FilesMap; ts: string; label: string; epoch?: number };
export type Project = { id: string; name: string; files: FilesMap; updatedAt: string };
export type PreviewWidth = "full" | "375" | "768" | "1280";
export type CdnPkg = { name: string; label: string; url: string };

// ── Theme (Tesla warm ivory — premium, clean, future-forward) ────────────────
export const T = {
  bg:       "#faf8f5",
  panel:    "#f4f2ef",
  surface:  "#faf8f5",
  topbar:   "#faf8f5",
  border:   "rgba(0,0,0,0.08)",
  borderHi: "rgba(0,0,0,0.2)",
  text:     "#0a0a0a",
  muted:    "#6b7280",
  accent:   "#0a0a0a",
  accentB:  "#1a1a1a",
  green:    "#16a34a",
  red:      "#dc2626",
  warn:     "#92400e",
  info:     "#1d4ed8",
} as const;

// ── Dark Theme ──────────────────────────────────────────────────────────────
export const TD = {
  bg:       "#0d1117",
  panel:    "#161b22",
  surface:  "#1c2128",
  topbar:   "#161b22",
  border:   "#30363d",
  borderHi: "rgba(249,115,22,0.45)",
  text:     "#e6edf3",
  muted:    "#8b949e",
  accent:   "#f97316",
  accentB:  "#f43f5e",
  green:    "#3fb950",
  red:      "#f85149",
  warn:     "#d29922",
  info:     "#58a6ff",
} as const;

/** Theme type (union of light/dark theme shapes) */
export type ThemeColors = {
  bg: string; panel: string; surface: string; topbar: string;
  border: string; borderHi: string; text: string; muted: string;
  accent: string; accentB: string; green: string; red: string;
  warn: string; info: string;
};

/** Get theme based on mode */
export function getTheme(mode: "light" | "dark"): ThemeColors {
  return mode === "dark" ? TD : T;
}

// ── Editor Theme Presets ──────────────────────────────────────────────────────
export type EditorThemePreset = {
  id: string;
  label: string;
  monacoTheme: string; // Monaco built-in or custom theme name
  bg: string;          // Editor background color (for preview)
  fg: string;          // Editor foreground color (for preview)
};

export const EDITOR_THEMES: EditorThemePreset[] = [
  { id: "vs-dark",    label: "Dark (기본)",    monacoTheme: "vs-dark",    bg: "#1e1e1e", fg: "#d4d4d4" },
  { id: "vs",         label: "Light",          monacoTheme: "vs",         bg: "#ffffff", fg: "#000000" },
  { id: "hc-black",   label: "High Contrast",  monacoTheme: "hc-black",  bg: "#000000", fg: "#ffffff" },
];

/** Register custom Monaco themes (call on editor mount) */
export function registerCustomThemes(monaco: { editor: { defineTheme: (name: string, data: Record<string, unknown>) => void } }) {
  // Dracula
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6272a4", fontStyle: "italic" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "string", foreground: "f1fa8c" },
      { token: "number", foreground: "bd93f9" },
      { token: "type", foreground: "8be9fd", fontStyle: "italic" },
    ],
    colors: { "editor.background": "#282a36", "editor.foreground": "#f8f8f2", "editor.lineHighlightBackground": "#44475a" },
  });
  // Nord
  monaco.editor.defineTheme("nord", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "616e88", fontStyle: "italic" },
      { token: "keyword", foreground: "81a1c1" },
      { token: "string", foreground: "a3be8c" },
      { token: "number", foreground: "b48ead" },
    ],
    colors: { "editor.background": "#2e3440", "editor.foreground": "#d8dee9", "editor.lineHighlightBackground": "#3b4252" },
  });
  // Solarized Dark
  monaco.editor.defineTheme("solarized-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "586e75", fontStyle: "italic" },
      { token: "keyword", foreground: "859900" },
      { token: "string", foreground: "2aa198" },
      { token: "number", foreground: "d33682" },
    ],
    colors: { "editor.background": "#002b36", "editor.foreground": "#839496", "editor.lineHighlightBackground": "#073642" },
  });
  // One Dark
  monaco.editor.defineTheme("one-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      { token: "keyword", foreground: "c678dd" },
      { token: "string", foreground: "98c379" },
      { token: "number", foreground: "d19a66" },
      { token: "type", foreground: "e5c07b" },
    ],
    colors: { "editor.background": "#282c34", "editor.foreground": "#abb2bf", "editor.lineHighlightBackground": "#2c313c" },
  });
}

// All available themes (built-in + custom)
export const ALL_EDITOR_THEMES: EditorThemePreset[] = [
  ...EDITOR_THEMES,
  { id: "dracula",        label: "Dracula",        monacoTheme: "dracula",        bg: "#282a36", fg: "#f8f8f2" },
  { id: "nord",           label: "Nord",           monacoTheme: "nord",           bg: "#2e3440", fg: "#d8dee9" },
  { id: "solarized-dark", label: "Solarized Dark", monacoTheme: "solarized-dark", bg: "#002b36", fg: "#839496" },
  { id: "one-dark",       label: "One Dark",       monacoTheme: "one-dark",       bg: "#282c34", fg: "#abb2bf" },
];

// ── AI Models ──────────────────────────────────────────────────────────────────
export type AiModelInfo = {
  id: string;
  provider: "openai" | "anthropic" | "gemini" | "grok" | "ollama";
  label: string;
  description: string;
  speed: "fast" | "medium" | "deep";
  cost: "free" | "$" | "$$" | "$$$";
};

export const AI_MODELS: AiModelInfo[] = [
  { id: "gpt-3.5-turbo",   provider: "openai",    label: "GPT-3.5 Turbo",     description: "빠르고 경제적",   speed: "fast",   cost: "$" },
  { id: "gpt-4o-mini",     provider: "openai",    label: "GPT-4o Mini",       description: "균형 잡힌 성능",   speed: "fast",   cost: "$" },
  { id: "gpt-4o",          provider: "openai",    label: "GPT-4o",            description: "최고 성능",       speed: "medium", cost: "$$$" },
  { id: "claude-haiku-4-5-20251001", provider: "anthropic", label: "Claude Haiku 4.5",  description: "초고속 응답",      speed: "fast",   cost: "$" },
  { id: "claude-sonnet-4-5-20250514", provider: "anthropic", label: "Claude Sonnet 4.5", description: "최신 코드 생성", speed: "medium", cost: "$$" },
  { id: "claude-sonnet-4-6", provider: "anthropic", label: "Claude Sonnet 4.6", description: "안정적 코드 생성", speed: "fast",   cost: "$$" },
  { id: "claude-opus-4-6",  provider: "anthropic", label: "Claude Opus 4.6",  description: "최강 추론·창작",  speed: "deep",   cost: "$$$" },
  { id: "gemini-1.5-flash", provider: "gemini",   label: "Gemini 1.5 Flash",  description: "빠른 응답",       speed: "fast",   cost: "$" },
  { id: "gemini-2.0-flash", provider: "gemini",   label: "Gemini 2.0 Flash",  description: "최신 멀티모달",   speed: "fast",   cost: "$" },
  { id: "grok-3",           provider: "grok",     label: "Grok 3",            description: "실시간 웹 검색",   speed: "medium", cost: "$$" },
];

// ── Model Picker constants ──────────────────────────────────────────────────────
export const LM_MODEL_KEY = "f9_lm_model_v1";

export const PROVIDER_COLORS: Record<string, string> = {
  ollama:    "#22c55e",
  openai:    "#60a5fa",
  anthropic: "#a855f7",
  gemini:    "#f97316",
  grok:      "#374151",
};

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
  <title>✨ 딸깍 AI</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="bg-orbs">
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>
    <div class="orb orb3"></div>
  </div>
  <div class="container">
    <div class="badge">딸깍 AI · 프롬프트로 앱 만들기</div>
    <h1>✨ 딸깍 AI</h1>
    <p class="subtitle">아래 예시를 클릭하거나 왼쪽 AI 패널에서<br>만들고 싶은 앱을 입력해보세요</p>
    <div class="cards">
      <div class="card" data-prompt="🛵 배달의민족 스타일 음식 배달 앱 만들어줘" onclick="copyPrompt(this)">
        <div class="card-icon">🛵</div>
        <div class="card-label">배달 앱 만들어줘</div>
        <div class="card-hint">클릭해서 복사</div>
      </div>
      <div class="card" data-prompt="🏠 직방 스타일 부동산 매물 앱 만들어줘" onclick="copyPrompt(this)">
        <div class="card-icon">🏠</div>
        <div class="card-label">부동산 앱 만들어줘</div>
        <div class="card-hint">클릭해서 복사</div>
      </div>
      <div class="card" data-prompt="🎮 테트리스 만들어줘" onclick="copyPrompt(this)">
        <div class="card-icon">🎮</div>
        <div class="card-label">테트리스 만들어줘</div>
        <div class="card-hint">클릭해서 복사</div>
      </div>
      <div class="card" data-prompt="📊 매출 대시보드 만들어줘" onclick="copyPrompt(this)">
        <div class="card-icon">📊</div>
        <div class="card-label">매출 대시보드 만들어줘</div>
        <div class="card-hint">클릭해서 복사</div>
      </div>
    </div>
    <div id="toast" class="toast"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  },
  "style.css": {
    name: "style.css", language: "css",
    content: `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #080b14;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

/* Ambient orbs */
.bg-orbs { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  animation: drift 12s ease-in-out infinite;
}
.orb1 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, #f97316, transparent 70%);
  top: -120px; left: -80px;
  animation-duration: 14s;
}
.orb2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #a855f7, transparent 70%);
  bottom: -100px; right: -60px;
  animation-duration: 10s;
  animation-delay: -4s;
}
.orb3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, #3b82f6, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 18s;
  animation-delay: -8s;
}
@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 15px) scale(0.95); }
}

.container {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 52px 44px 44px;
  background: rgba(255,255,255,0.03);
  border-radius: 28px;
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(24px);
  max-width: 600px;
  width: 92%;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
}

.badge {
  display: inline-block;
  padding: 5px 14px;
  background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(244,63,94,0.2));
  border: 1px solid rgba(249,115,22,0.35);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f97316;
  margin-bottom: 20px;
}

h1 {
  font-size: 2.4rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: rgba(255,255,255,0.45);
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 36px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card {
  padding: 20px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(249,115,22,0.08), rgba(168,85,247,0.06));
  opacity: 0;
  transition: opacity 0.2s;
}

.card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(249,115,22,0.3);
  box-shadow: 0 12px 40px rgba(249,115,22,0.15), 0 4px 12px rgba(0,0,0,0.3);
}
.card:hover::before { opacity: 1; }

.card:active {
  transform: translateY(-2px) scale(0.98);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  display: block;
}

.card-label {
  font-size: 13.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}

.card-hint {
  font-size: 11px;
  color: rgba(255,255,255,0.28);
  position: relative;
  z-index: 1;
  transition: color 0.2s;
}
.card:hover .card-hint { color: rgba(249,115,22,0.7); }

/* Shake animation */
@keyframes shake {
  0%,100% { transform: translateX(0) translateY(-4px) scale(1.02); }
  20%      { transform: translateX(-5px) translateY(-4px) scale(1.02); }
  40%      { transform: translateX(5px) translateY(-4px) scale(1.02); }
  60%      { transform: translateX(-3px) translateY(-4px) scale(1.02); }
  80%      { transform: translateX(3px) translateY(-4px) scale(1.02); }
}
.card.shaking { animation: shake 0.4s ease; }

/* Copied flash */
.card.copied {
  border-color: rgba(63,185,80,0.5);
  background: rgba(63,185,80,0.08);
}
.card.copied .card-hint { color: #3fb950; }

/* Toast */
.toast {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  background: linear-gradient(135deg, #f97316, #f43f5e);
  color: #fff;
  padding: 10px 22px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(249,115,22,0.4);
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
  pointer-events: none;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}`,
  },
  "script.js": {
    name: "script.js", language: "javascript",
    content: `function copyPrompt(card) {
  const prompt = card.getAttribute("data-prompt");

  // 클립보드 복사
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(prompt).catch(() => fallbackCopy(prompt));
  } else {
    fallbackCopy(prompt);
  }

  // 흔들림 애니메이션
  card.classList.remove("shaking", "copied");
  void card.offsetWidth; // reflow
  card.classList.add("shaking");

  card.addEventListener("animationend", function onEnd() {
    card.removeEventListener("animationend", onEnd);
    card.classList.remove("shaking");
    card.classList.add("copied");
    setTimeout(() => card.classList.remove("copied"), 1200);
  });

  // 토스트 메시지
  showToast("클립보드에 복사됐어요! AI 패널에 붙여넣기 해보세요 ✨");
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}`,
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

// ── ESM 패키지 → UMD CDN 매핑 (import 문 자동 CDN 치환) ───────────────────────
const ESM_PKG_MAP: Record<string, { cdn: string; global: string }> = {
  "react":              { cdn: "https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js",           global: "React"   },
  "react-dom":          { cdn: "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js",   global: "ReactDOM"},
  "three":              { cdn: "https://cdn.jsdelivr.net/npm/three/build/three.min.js",                    global: "THREE"   },
  "chart.js":           { cdn: "https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js",              global: "Chart"   },
  "d3":                 { cdn: "https://cdn.jsdelivr.net/npm/d3/dist/d3.min.js",                           global: "d3"      },
  "gsap":               { cdn: "https://cdn.jsdelivr.net/npm/gsap/dist/gsap.min.js",                       global: "gsap"    },
  "axios":              { cdn: "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js",                     global: "axios"   },
  "lodash":             { cdn: "https://cdn.jsdelivr.net/npm/lodash/lodash.min.js",                        global: "_"       },
  "moment":             { cdn: "https://cdn.jsdelivr.net/npm/moment/moment.min.js",                        global: "moment"  },
  "vue":                { cdn: "https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js",               global: "Vue"     },
  "p5":                 { cdn: "https://cdn.jsdelivr.net/npm/p5/lib/p5.min.js",                            global: "p5"      },
  "tone":               { cdn: "https://cdn.jsdelivr.net/npm/tone/build/Tone.js",                          global: "Tone"    },
  "pixi.js":            { cdn: "https://cdn.jsdelivr.net/npm/pixi.js/dist/pixi.min.js",                   global: "PIXI"    },
  "matter-js":          { cdn: "https://cdn.jsdelivr.net/npm/matter-js/build/matter.min.js",               global: "Matter"  },
  "anime":              { cdn: "https://cdn.jsdelivr.net/npm/animejs/lib/anime.min.js",                    global: "anime"   },
  "hammer":             { cdn: "https://cdn.jsdelivr.net/npm/hammerjs/hammer.min.js",                      global: "Hammer"  },
  "socket.io-client":   { cdn: "https://cdn.jsdelivr.net/npm/socket.io-client/dist/socket.io.min.js",     global: "io"      },
  "marked":             { cdn: "https://cdn.jsdelivr.net/npm/marked/marked.min.js",                        global: "marked"  },
  "highlight.js":       { cdn: "https://cdn.jsdelivr.net/npm/highlight.js/lib/highlight.min.js",           global: "hljs"    },
  "dayjs":              { cdn: "https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js",                          global: "dayjs"   },
  "confetti":           { cdn: "https://cdn.jsdelivr.net/npm/canvas-confetti/dist/confetti.browser.min.js",global: "confetti"},
  "phaser":             { cdn: "https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js",               global: "Phaser"  },
  "leaflet":            { cdn: "https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.js",                   global: "L"       },
  "fabric":             { cdn: "https://cdn.jsdelivr.net/npm/fabric@5/dist/fabric.min.js",               global: "fabric"  },
  "konva":              { cdn: "https://cdn.jsdelivr.net/npm/konva/konva.min.js",                         global: "Konva"   },
  "howler":             { cdn: "https://cdn.jsdelivr.net/npm/howler/dist/howler.min.js",                  global: "Howl"    },
  "sweetalert2":        { cdn: "https://cdn.jsdelivr.net/npm/sweetalert2/dist/sweetalert2.all.min.js",   global: "Swal"    },
  "sortablejs":         { cdn: "https://cdn.jsdelivr.net/npm/sortablejs/Sortable.min.js",                 global: "Sortable"},
  "alpinejs":           { cdn: "https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js",                global: "Alpine"  },
  // UI Frameworks
  "bootstrap":          { cdn: "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.bundle.min.js", global: "bootstrap" },
  // Animation / Interaction
  "typed.js":           { cdn: "https://cdn.jsdelivr.net/npm/typed.js/dist/typed.umd.js",               global: "Typed"   },
  "aos":                { cdn: "https://cdn.jsdelivr.net/npm/aos/dist/aos.js",                           global: "AOS"     },
  "lottie-web":         { cdn: "https://cdn.jsdelivr.net/npm/lottie-web/build/player/lottie.min.js",    global: "lottie"  },
  "particles.js":       { cdn: "https://cdn.jsdelivr.net/npm/particles.js/particles.min.js",             global: "particlesJS" },
  "tsparticles":        { cdn: "https://cdn.jsdelivr.net/npm/tsparticles/tsparticles.bundle.min.js",     global: "tsParticles" },
  "vivus":              { cdn: "https://cdn.jsdelivr.net/npm/vivus/dist/vivus.min.js",                   global: "Vivus"   },
  "scrollreveal":       { cdn: "https://cdn.jsdelivr.net/npm/scrollreveal/dist/scrollreveal.min.js",     global: "ScrollReveal" },
  // Data / Math
  "mathjs":             { cdn: "https://cdn.jsdelivr.net/npm/mathjs/lib/browser/math.min.js",            global: "math"    },
  "numeral":            { cdn: "https://cdn.jsdelivr.net/npm/numeral/numeral.min.js",                    global: "numeral" },
  "papaparse":          { cdn: "https://cdn.jsdelivr.net/npm/papaparse/papaparse.min.js",                global: "Papa"    },
  "fuse.js":            { cdn: "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.min.js",                 global: "Fuse"    },
  // Utility
  "qrcode":             { cdn: "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",               global: "QRCode"  },
  "dompurify":          { cdn: "https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js",              global: "DOMPurify" },
  "uuid":               { cdn: "https://cdn.jsdelivr.net/npm/uuid/dist/umd/uuidv4.min.js",              global: "uuidv4"  },
};

/** JS 문자열의 ESM import 구문 파싱: import X from 'pkg' → Set<pkgName> */
function detectEsmPackages(code: string): Set<string> {
  const re = /^import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"./][^'"]*)['"]/gm;
  const pkgs = new Set<string>();
  let m;
  while ((m = re.exec(code)) !== null) pkgs.add(m[1].split("/")[0]);
  return pkgs;
}

/** JS syntax check — import/export 줄 제거 후 new Function으로 문법 검사 */
function checkJsSyntax(code: string): string | null {
  // Strip imports/exports, TypeScript type annotations, and decorators before syntax check
  const stripped = code
    .replace(/^(import|export\s+default|export\s+\{[^}]*\}|export)\s+.*/gm, "")
    .replace(/:\s*(?:[A-Z]\w*|string|number|boolean|void|any|unknown|never|null|undefined)(?:\[\]|\s*\|\s*(?:[A-Z]\w*|string|number|boolean|null|undefined))*\s*(?=[=;,{(]|$)/gm, "")
    .replace(/<[A-Z]\w*(?:\s+[^>]*)?\s*>/g, "") // Remove JSX-like generics
    .replace(/^\s*@\w+.*/gm, "") // Remove decorators
    ;
  try { new Function(stripped); return null; }
  catch (e) {
    const msg = (e as Error).message;
    // Suppress false positives for modern syntax patterns
    if (/Unexpected token '\.'/i.test(msg)) return null; // optional chaining
    if (/Unexpected token '\?'/i.test(msg)) return null; // nullish coalescing
    if (/Unexpected token '<'/i.test(msg)) return null; // generics / JSX (handled by Babel)
    if (/Unexpected identifier/i.test(msg) && /async|await/.test(code)) return null;
    if (/Unexpected token ','/i.test(msg)) return null; // destructuring false positive from strip regex
    return msg;
  }
}

// ── Preview builders ────────────────────────────────────────────────────────────
export function buildPreview(files: FilesMap): string {
  // index.html 우선; 없으면 다른 HTML 파일로 폴백
  const htmlFile = files["index.html"]
    ?? Object.values(files).find(f => f.language === "html" || f.name?.endsWith(".html"))
    ?? null;
  if (!htmlFile) {
    const hasPython = Object.values(files).some(f => f.language === "python" || f.name?.endsWith(".py"));
    if (hasPython) {
      return `<body style='color:#1b1b1f;background:#f9fafb;padding:32px 24px;font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto'>
        <div style='font-size:48px;margin-bottom:16px'>🐍</div>
        <h2 style='font-size:20px;font-weight:800;margin-bottom:8px;color:#0f0f11'>Python은 서버에서 실행됩니다</h2>
        <p style='font-size:14px;color:#6b7280;line-height:1.7;margin-bottom:20px'>브라우저 내장 프리뷰는 HTML/CSS/JS만 지원합니다.<br>Python 코드는 로컬에서 <code style='background:#f3f4f6;padding:2px 6px;border-radius:4px'>python main.py</code> 로 실행하세요.</p>
        <div style='background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:16px 20px;font-size:13px;color:#374151'>
          <b>팁:</b> Python을 웹으로 배포하려면 AI에게<br><em>"Flask로 API 서버 만들고 HTML 프론트엔드 함께 만들어줘"</em>라고 요청해보세요.
        </div>
      </body>`;
    }
    return "<body style='color:#1b1b1f;background:#fff;padding:20px;font-family:sans-serif'><h2>index.html 없음</h2></body>";
  }
  let html = htmlFile.content;

  // CSP/X-Frame-Options 제거 (iframe 프리뷰 차단 방지)
  html = html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");

  // CSS 파일 인라인화 (bare, ./ 또는 ../ 접두사 모두 처리)
  for (const [fname, f] of Object.entries(files)) {
    if (f.language === "css") {
      html = html.replace(new RegExp(`<link[^>]+href=["'](?:\\.{0,2}/)?${escRx(fname)}["'][^>]*>`, "gi"), `<style>${f.content}</style>`);
    }
  }

  // ── JS/TS 파일 준비 + ESM 패키지 자동 CDN 치환 ──────────────────────────────
  const JSX_RE = /import\s+React|from\s+['"]react['"]|ReactDOM\s*\.|createRoot\s*\(|<[A-Z][A-Za-z0-9]*[\s/>]|<\/[A-Z][A-Za-z0-9]*>/;
  const jsFiles = Object.values(files).filter(f => f.language === "javascript" || f.language === "typescript");
  const allJsContent = jsFiles.map(f => f.content).join("\n");

  // 인라인 <script> 태그 내용 추출 (src 없는 것만)
  const inlineScripts = (html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi) || [])
    .map(s => s.replace(/<script[^>]*>|<\/script>/gi, "")).join("\n");

  // ESM import 감지 → 알려진 패키지는 CDN으로 자동 대체
  const allCodeForEsm = allJsContent + "\n" + inlineScripts;
  const detectedPkgs = detectEsmPackages(allCodeForEsm);
  const esmCdnTags: string[] = [];
  const esmUnknownPkgs: string[] = [];

  for (const pkg of detectedPkgs) {
    if (ESM_PKG_MAP[pkg]) {
      const cdnUrl = ESM_PKG_MAP[pkg].cdn;
      // 중복 방지: 이미 해당 CDN이 HTML에 있으면 스킵
      if (!html.includes(cdnUrl)) esmCdnTags.push(`<script src="${cdnUrl}"></script>`);
    } else {
      esmUnknownPkgs.push(pkg);
    }
  }

  // CDN 태그를 </head> 앞에 주입
  if (esmCdnTags.length > 0) {
    const cdnBlock = esmCdnTags.join("\n");
    if (html.includes("</head>")) html = html.replace("</head>", cdnBlock + "\n</head>");
    else if (html.includes("<body")) html = html.replace(/<body([^>]*)>/i, `<body$1>\n${cdnBlock}`);
    else html = cdnBlock + "\n" + html;
  }

  // Leaflet CSS 자동 주입 (leaflet.js가 감지되면 CSS도 함께)
  const leafletCssUrl = "https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css";
  if (detectedPkgs.has("leaflet") && !html.includes(leafletCssUrl)) {
    const leafletCssTag = `<link rel="stylesheet" href="${leafletCssUrl}">`;
    if (html.includes("</head>")) html = html.replace("</head>", leafletCssTag + "\n</head>");
    else if (html.includes("<body")) html = html.replace(/<body([^>]*)>/i, `<body$1>\n${leafletCssTag}`);
    else html = leafletCssTag + "\n" + html;
  }

  // Highlight.js CSS 자동 주입
  const hlCssUrl = "https://cdn.jsdelivr.net/npm/highlight.js/styles/github-dark.min.css";
  if (detectedPkgs.has("highlight.js") && !html.includes(hlCssUrl)) {
    const hlCssTag = `<link rel="stylesheet" href="${hlCssUrl}">`;
    if (html.includes("</head>")) html = html.replace("</head>", hlCssTag + "\n</head>");
    else html = hlCssTag + "\n" + html;
  }

  // Bootstrap CSS 자동 주입 (bootstrap import 또는 bootstrap.bundle 스크립트 감지)
  const bootstrapCssUrl = "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css";
  if ((detectedPkgs.has("bootstrap") || /bootstrap.*bundle|bootstrap.*min\.js/i.test(html)) && !html.includes(bootstrapCssUrl)) {
    const bsCssTag = `<link rel="stylesheet" href="${bootstrapCssUrl}">`;
    if (html.includes("</head>")) html = html.replace("</head>", bsCssTag + "\n</head>");
    else html = bsCssTag + "\n" + html;
  }

  // AOS CSS 자동 주입
  const aosCssUrl = "https://cdn.jsdelivr.net/npm/aos/dist/aos.css";
  if (detectedPkgs.has("aos") && !html.includes(aosCssUrl)) {
    const aosCssTag = `<link rel="stylesheet" href="${aosCssUrl}">`;
    if (html.includes("</head>")) html = html.replace("</head>", aosCssTag + "\n</head>");
    else html = aosCssTag + "\n" + html;
  }

  // Font Awesome CSS 자동 주입 (fa- 아이콘 클래스 패턴 감지)
  const faPattern = /class="[^"]*\bfa[srbl]?\b|<i\s+class="fa/i;
  const faCssUrl = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
  if (faPattern.test(html) && !html.includes("font-awesome") && !html.includes(faCssUrl)) {
    const faCssTag = `<link rel="stylesheet" href="${faCssUrl}">`;
    if (html.includes("</head>")) html = html.replace("</head>", faCssTag + "\n</head>");
    else html = faCssTag + "\n" + html;
  }

  // Tailwind CSS CDN 자동 주입 (tailwind 클래스 패턴 감지)
  const twPattern = /class="[^"]*(?:bg-(?:blue|red|green|gray|yellow|purple|pink|indigo|white|black|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d|text-(?:sm|base|lg|xl|2xl|3xl|4xl|5xl)|flex|grid|rounded|shadow|border-|p-\d|px-\d|py-\d|mx-\d|my-\d|w-\d|h-\d|gap-\d)/;
  if (twPattern.test(html) && !html.includes("tailwindcss.com") && !html.includes("tailwind.min.css")) {
    const twScript = `<script src="https://cdn.tailwindcss.com"></script>`;
    if (html.includes("</head>")) html = html.replace("</head>", twScript + "\n</head>");
    else html = twScript + "\n" + html;
  }

  // 알 수 없는 패키지는 esm.sh importmap으로 처리
  if (esmUnknownPkgs.length > 0 && !html.includes('type="importmap"')) {
    const imports: Record<string, string> = {};
    for (const pkg of esmUnknownPkgs) {
      imports[pkg] = `https://esm.sh/${pkg}`;
      imports[`${pkg}/`] = `https://esm.sh/${pkg}/`;
    }
    const importMapTag = `<script type="importmap">${JSON.stringify({ imports })}</script>`;
    if (html.includes("</head>")) html = html.replace("</head>", importMapTag + "\n</head>");
    else html = importMapTag + "\n" + html;
  }

  // JS 파일 콘텐츠 변환: ESM import 구문 제거 (CDN 글로벌로 대체됨)
  const transformJs = (code: string): string => {
    if (detectedPkgs.size === 0) return code;
    // 알려진 패키지의 import 구문 제거 (CDN 글로벌 사용)
    return code.replace(/^import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"./][^'"]*)['"]\s*;?\s*$/gm, (line, pkg) => {
      const root = pkg.split("/")[0];
      if (ESM_PKG_MAP[root]) return `// [CDN: ${root} → window.${ESM_PKG_MAP[root].global}]`;
      return line; // 알 수 없는 패키지는 그대로 (importmap이 처리)
    });
  };

  // ── JSX / Babel 감지 및 주입 ────────────────────────────────────────────────
  const hasJsx = JSX_RE.test(allJsContent) || JSX_RE.test(inlineScripts);
  const hasBabel = /babel/i.test(html);
  const hasReact = /unpkg\.com\/react|jsdelivr\.net\/npm\/react|cdnjs\.cloudflare\.com\/ajax\/libs\/react/i.test(html);

  if (hasJsx) {
    // Babel + React CDN 주입 (없는 것만)
    let cdnToAdd = "";
    if (!hasReact && !esmCdnTags.some(t => t.includes("react"))) {
      cdnToAdd += `<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>\n`
        + `<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>\n`;
    }
    if (!hasBabel) cdnToAdd += `<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js"></script>\n`;
    if (cdnToAdd) {
      if (html.includes("</head>")) html = html.replace("</head>", cdnToAdd + "</head>");
      else if (html.includes("<body")) html = html.replace(/<body([^>]*)>/i, `<body$1>\n${cdnToAdd}`);
      else html = cdnToAdd + html;
    }

    // 별도 JS/TS 파일: type="text/babel" 로 인라인화
    for (const [fname, f] of Object.entries(files)) {
      if (f.language === "javascript" || f.language === "typescript") {
        const transformed = transformJs(f.content);
        // Syntax check — 문제 있으면 콘솔 경고 주입
        const syntaxErr = checkJsSyntax(transformed);
        if (syntaxErr) {
          const errNote = `<script>console.error('[${fname}] SyntaxError: ${syntaxErr.replace(/'/g, "\\'").replace(/"/g, '\\"')}');</script>`;
          if (html.includes("</head>")) html = html.replace("</head>", errNote + "</head>");
        }
        html = html.replace(new RegExp(`<script[^>]+src=["'](?:\\.{0,2}/)?${escRx(fname)}["'][^>]*><\\/script>`, "gi"),
          `<script type="text/babel" data-presets="react,typescript,env">${transformed}</script>`);
      }
    }

    // 인라인 <script> 태그에 JSX가 있으면 type="text/babel" 추가
    html = html.replace(/<script(?![^>]*\btype=)([^>]*)>([\s\S]*?)<\/script>/gi, (_m, attrs, content) => {
      if (!content.trim()) return _m;
      if (JSX_RE.test(content)) return `<script type="text/babel" data-presets="react,env"${attrs}>${transformJs(content)}</script>`;
      return _m;
    });

  } else {
    // 일반 JS 인라인화 (TypeScript도 포함)
    for (const [fname, f] of Object.entries(files)) {
      if (f.language === "javascript" || f.language === "typescript") {
        const transformed = transformJs(f.content);
        // Syntax check
        const syntaxErr = checkJsSyntax(transformed);
        if (syntaxErr) {
          const errNote = `<script>console.error('[${fname}] SyntaxError: ${syntaxErr.replace(/'/g, "\\'").replace(/"/g, '\\"')}');</script>`;
          if (html.includes("</head>")) html = html.replace("</head>", errNote + "</head>");
        }
        // TypeScript 파일은 Babel로 트랜스파일 (타입 제거 필요)
        if (f.language === "typescript") {
          const babelCdn = `<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js"></script>`;
          if (!html.includes("babel.min.js")) {
            if (html.includes("</head>")) html = html.replace("</head>", babelCdn + "\n</head>");
            else html = babelCdn + "\n" + html;
          }
        }
        const babelTag = (f.language === "typescript")
          ? `<script type="text/babel" data-presets="typescript,env">${transformed}</script>`
          : `<script>${transformed}</script>`;
        html = html.replace(new RegExp(`<script[^>]+src=["'](?:\\.{0,2}/)?${escRx(fname)}["'][^>]*><\\/script>`, "gi"), babelTag);
      }
    }

    // 인라인 <script>에 ESM import 있으면 변환
    if (detectedPkgs.size > 0) {
      html = html.replace(/<script(?![^>]*\btype=)([^>]*)>([\s\S]*?)<\/script>/gi, (_m, attrs, content) => {
        if (!content.trim()) return _m;
        const t = transformJs(content);
        return t !== content ? `<script${attrs}>${t}</script>` : _m;
      });
    }
  }

  // Google Fonts @import → <link> 변환 (CSS @import는 sandbox에서 차단됨)
  // style 태그 내부의 @import url() 처리
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
    const links: string[] = [];
    const cleaned = css.replace(/@import\s+url\s*\(\s*['"]?(https?:\/\/fonts\.googleapis\.com[^'")\s]+)['"]?\s*\)[^;]*;/gi, (_m: string, url: string) => {
      links.push(`<link rel="stylesheet" href="${url}">`);
      return "";
    }).replace(/@import\s+['"]?(https?:\/\/fonts\.googleapis\.com[^'";\s]+)['"]?[^;]*;/gi, (_m: string, url: string) => {
      links.push(`<link rel="stylesheet" href="${url}">`);
      return "";
    });
    return links.join("\n") + `<style${attrs}>${cleaned}</style>`;
  });
  // Pretendard CDN @import 처리
  html = html.replace(/@import\s+url\s*\(\s*['"]?(https?:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus[^'")\s]+)['"]?\s*\)[^;]*;/gi, (_m, url) => {
    return `</style><link rel="stylesheet" href="${url}"><style>`;
  });

  // canvas 요소가 있고 body에 background 스타일이 없으면 기본 다크 배경 주입
  // (단, 이미 body background가 명시된 경우엔 강제하지 않음 — 밝은 테마 게임 방지)
  if (/<canvas[\s>]/i.test(html) && !/body\s*\{[^}]*background/i.test(html)) {
    const canvasCss = `<style>body:not([style*="background"]){background:#111}canvas:not([style*="background"]){background:transparent}</style>`;
    if (html.includes("</head>")) html = html.replace("</head>", canvasCss + "</head>");
    else if (html.includes("<body")) html = html.replace(/<body([^>]*)>/i, `<body$1>${canvasCss}`);
  }

  // ── 모바일 viewport meta 자동 보장 ────────────────────────────────────────
  if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
    const viewportTag = `<meta name="viewport" content="width=device-width, initial-scale=1.0">`;
    if (html.includes("<head>")) html = html.replace("<head>", "<head>\n" + viewportTag);
    else if (html.includes("<html")) html = html.replace(/<html([^>]*)>/i, `<html$1><head>${viewportTag}</head>`);
    else html = `<head>${viewportTag}</head>` + html;
  }

  // ── lang="ko" 자동 주입 ──────────────────────────────────────────────────
  if (!html.includes(' lang=')) {
    html = html.replace(/<html(?=[^>]*>)/i, '<html lang="ko"');
    // If no <html> tag, wrap
    if (!html.includes('<html')) html = '<html lang="ko">' + html + '</html>';
  }

  // ── Pretendard 폰트 자동 주입 (한국어 최적화, 이미 폰트 지정 없을 때만) ──
  if (!html.includes("Pretendard") && !html.includes("fonts.googleapis.com") && !html.includes("orioncactus")) {
    const pretendardLink = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">`;
    const baseFont = `<style>*,*::before,*::after{box-sizing:border-box}body{font-family:"Pretendard Variable","Pretendard",-apple-system,sans-serif;-webkit-font-smoothing:antialiased}</style>`;
    if (html.includes("</head>")) html = html.replace("</head>", pretendardLink + "\n" + baseFont + "\n</head>");
    else if (html.includes("<body")) html = html.replace(/<body([^>]*)>/i, `<body$1>\n${pretendardLink}\n${baseFont}`);
    else html = pretendardLink + "\n" + baseFont + "\n" + html;
  }

  return html;
}

export function injectConsoleCapture(html: string): string {
  const s = `<script>(function(){
var p=function(d){try{window.parent.postMessage(Object.assign({type:'F9IDE'},d),'*')}catch(e){}};
/* localStorage/sessionStorage 폴리필 — sandbox iframe은 allow-same-origin 없이 localStorage 차단됨 (Chrome: SecurityError, Edge: 무음 차단) */
var __lsd={};var __lsi={getItem:function(k){return Object.prototype.hasOwnProperty.call(__lsd,k)?__lsd[k]:null},setItem:function(k,v){__lsd[k]=String(v)},removeItem:function(k){delete __lsd[k]},clear:function(){__lsd={}},key:function(i){return Object.keys(__lsd)[i]||null},get length(){return Object.keys(__lsd).length}};
try{Object.defineProperty(window,'localStorage',{value:__lsi,configurable:true,writable:true});}catch(e){}
try{Object.defineProperty(window,'sessionStorage',{value:__lsi,configurable:true,writable:true});}catch(e){}
/* Protect getElementById/querySelector from null errors — return no-op proxy to prevent chaining crashes */
var _noop=function(){return _noop};_noop.style={};_noop.classList={add:_noop,remove:_noop,toggle:_noop,contains:function(){return false}};_noop.addEventListener=_noop;_noop.removeEventListener=_noop;_noop.setAttribute=_noop;_noop.appendChild=_noop;_noop.removeChild=_noop;_noop.textContent='';_noop.innerHTML='';_noop.value='';_noop.innerText='';_noop.forEach=_noop;_noop.length=0;_noop.querySelectorAll=function(){return[]};_noop.querySelector=function(){return _noop};_noop.closest=function(){return _noop};_noop.getContext=function(){var _cx={};var nf=function(){return _cx};var props=['fillRect','strokeRect','clearRect','beginPath','closePath','moveTo','lineTo','arc','arcTo','bezierCurveTo','quadraticCurveTo','ellipse','rect','stroke','fill','clip','fillText','strokeText','measureText','drawImage','save','restore','translate','rotate','scale','setTransform','resetTransform','createLinearGradient','createRadialGradient','createPattern','getImageData','putImageData','createImageData','setLineDash','getLineDash','isPointInPath'];props.forEach(function(k){_cx[k]=nf});_cx.fillStyle='';_cx.strokeStyle='';_cx.lineWidth=1;_cx.font='';_cx.globalAlpha=1;_cx.canvas={width:0,height:0};return _cx};
var _gid=document.getElementById.bind(document);
document.getElementById=function(id){var el=_gid(id);if(!el){p({level:'warn',msg:'getElementById("'+id+'") → null'});return _noop;}return el;};
var _qs=document.querySelector.bind(document);
document.querySelector=function(sel){var el=_qs(sel);if(!el)return _noop;return el;};
/* querySelectorAll: wrap with try-catch so .forEach() never throws on empty results */
var _qsa=document.querySelectorAll.bind(document);
document.querySelectorAll=function(sel){try{var r=_qsa(sel);return r&&r.length>=0?r:[];}catch(e){return [];}};
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

// ── 파일 절단 감지 (FIX 7: stricter checks to reduce false positives) ───────────
export function isFileTruncated(content: string, fname: string): boolean {
  if (!content || content.length < 100) return false;
  const ext = fname.split(".").pop()?.toLowerCase() ?? "";
  const trimmed = content.trimEnd();

  // Check for explicit truncation markers (tail of file)
  if (/\/\*\s*\.{2,}\s*\*\/|\/\/\s*\.{3,}|```\s*$/.test(trimmed)) return true;

  const lastChar = trimmed[trimmed.length - 1];

  if (ext === "js" || ext === "ts") {
    // JS/TS should end with } or ;
    if (lastChar !== "}" && lastChar !== ";") return true;
    // Only flag severe brace imbalance (> 5, not just any mismatch)
    const opens = (content.match(/\{/g) ?? []).length;
    const closes = (content.match(/\}/g) ?? []).length;
    if (opens - closes > 5) return true;
  }

  if (ext === "html") {
    if (!content.includes("</html>") && !content.includes("</body>")) return true;
  }

  if (ext === "css") {
    // CSS should end with }
    if (lastChar !== "}") return true;
    const opens = (content.match(/\{/g) ?? []).length;
    const closes = (content.match(/\}/g) ?? []).length;
    if (opens - closes > 3) return true;
  }

  return false;
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
  if (l < 300) return 50;      // ~$0.05
  if (l < 1500) return 150;    // ~$0.15
  if (l < 5000) return 350;    // ~$0.35
  return 750;                  // ~$0.75
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

// ── Timeouts & delays ───────────────────────────────────────────────────────────
export const TOAST_DURATION_MS    = 5000;
export const DEBOUNCE_DELAY_MS    = 300;
export const ANIMATION_DURATION_MS = 200;

// ── Env vars injection ──────────────────────────────────────────────────────────
export const ENV_VARS_KEY = "f9_env_vars_v1";

export function injectEnvVars(html: string, envVars: Record<string, string>): string {
  if (!envVars || Object.keys(envVars).length === 0) return html;
  const script = `<script>window.__ENV=${JSON.stringify(envVars)};</script>`;
  if (html.includes("<head>")) return html.replace("<head>", "<head>" + script);
  if (html.includes("<body>")) return html.replace("<body>", "<body>" + script);
  return script + html;
}

export function injectSupabaseCdn(html: string, envVars: Record<string, string>): string {
  if (!envVars?.SUPABASE_URL) return html;
  const cdnTag = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';
  // Only inject if not already present
  if (html.includes("supabase-js")) return html;
  if (html.includes("<head>")) return html.replace("<head>", "<head>" + cdnTag);
  return cdnTag + html;
}

// ── Storage keys ────────────────────────────────────────────────────────────────
export const AI_HIST_KEY = "f9_ai_hist_v1";
export const PROJ_KEY    = "f9_projects_v3";
export const CUR_KEY     = "f9_cur_proj";
export const DEPLOY_HIST_KEY = "f9_deploy_hist_v1";
export const AUTO_TASK_KEY   = "f9_auto_task_v1";

// ── Korean Business Templates ────────────────────────────────────────────────
export type KoreanTemplate = {
  id: string;
  category: string;
  icon: string;
  name: string;
  desc: string;
  prompt: string;
};

export const KOREAN_BUSINESS_TEMPLATES: KoreanTemplate[] = [
  {
    id: "cafe-menu",
    category: "쇼핑",
    icon: "☕",
    name: "카페 메뉴판",
    desc: "감성적인 카페 디지털 메뉴판",
    prompt: "감성적인 카페 메뉴판 웹앱을 만들어줘. 커피, 음료, 디저트 카테고리로 나누고, 가격과 설명 포함. 미니멀 화이트 베이지 톤, 고급스러운 타이포그래피 사용",
  },
  {
    id: "smart-store",
    category: "쇼핑",
    icon: "🛒",
    name: "상품 소개 페이지",
    desc: "스마트스토어형 상품 랜딩",
    prompt: "스마트스토어 스타일 상품 소개 랜딩페이지를 만들어줘. 대표 이미지 영역, 가격, 특장점 3가지, 리뷰 섹션, 구매 버튼 포함. 깔끔한 화이트 디자인",
  },
  {
    id: "startup-landing",
    category: "비즈니스",
    icon: "🚀",
    name: "스타트업 랜딩",
    desc: "모던 SaaS 랜딩 페이지",
    prompt: "스타트업 SaaS 서비스 랜딩 페이지를 만들어줘. 히어로 섹션, 기능 3가지, 요금제, 팀 소개, CTA 버튼 포함. 다크모드, 그라디언트 포인트 컬러, 애플 스타일",
  },
  {
    id: "portfolio",
    category: "비즈니스",
    icon: "📇",
    name: "개인 포트폴리오",
    desc: "개발자/디자이너 포트폴리오",
    prompt: "개발자 개인 포트폴리오 웹사이트를 만들어줘. 소개, 기술 스택, 프로젝트 3개, 연락처 섹션 포함. 다크 테마, 타이핑 애니메이션, 부드러운 스크롤",
  },
  {
    id: "instagram-link",
    category: "라이프",
    icon: "🔗",
    name: "인스타 링크 페이지",
    desc: "Linktree 스타일 링크 모음",
    prompt: "인스타그램 링크 모음 페이지를 만들어줘 (Linktree 스타일). 프로필 사진 영역, 소개글, 링크 버튼 6개. 핑크-퍼플 그라디언트, 부드러운 애니메이션",
  },
  {
    id: "wedding",
    category: "라이프",
    icon: "💌",
    name: "청첩장",
    desc: "디지털 모바일 청첩장",
    prompt: "모바일 청첩장 웹페이지를 만들어줘. 신랑신부 이름, 예식 날짜/장소, 지도, 참석 여부 응답 폼 포함. 로맨틱한 화이트 골드 톤, 꽃 일러스트 패턴",
  },
  {
    id: "real-estate",
    category: "쇼핑",
    icon: "🏠",
    name: "부동산 매물 소개",
    desc: "매물 랜딩 페이지",
    prompt: "부동산 매물 소개 랜딩페이지를 만들어줘. 메인 사진 슬라이더, 위치/면적/가격 정보, 특징 4가지, 문의 버튼 포함. 신뢰감 있는 네이비-화이트 톤",
  },
  {
    id: "budget-calculator",
    category: "도구",
    icon: "💰",
    name: "가계부 & 예산 관리",
    desc: "수입/지출 추적 앱",
    prompt: "가계부 & 월별 예산 관리 앱을 만들어줘. 수입/지출 입력, 카테고리 분류, 월별 차트, 잔액 표시 기능. localStorage 저장, 깔끔한 그린 톤 디자인",
  },
  {
    id: "event-invite",
    category: "라이프",
    icon: "🎉",
    name: "행사 초대장",
    desc: "파티/행사 초대 페이지",
    prompt: "행사 초대장 웹페이지를 만들어줘. 이벤트 타이틀, 날짜/시간/장소, 카운트다운 타이머, RSVP 폼 포함. 컬러풀하고 축제 분위기 넘치는 디자인",
  },
  {
    id: "service-intro",
    category: "비즈니스",
    icon: "📊",
    name: "서비스 소개 원페이저",
    desc: "애플 스타일 서비스 소개",
    prompt: "서비스 소개 원페이저 웹사이트를 만들어줘. 히어로 슬로건, 서비스 특장점 3가지, 이용 후기 2개, CTA 섹션 포함. 애플 스타일 미니멀 화이트, 큰 타이포그래피",
  },
  {
    id: "pet-diary",
    category: "라이프",
    icon: "🐾",
    name: "반려동물 다이어리",
    desc: "펫 건강 기록 앱",
    prompt: "반려동물 케어 다이어리 앱을 만들어줘. 반려동물 프로필 등록, 예방접종/건강검진/체중 기록, 오늘 할 일 체크리스트, 귀여운 파스텔톤 디자인",
  },
  {
    id: "workout-tracker",
    category: "라이프",
    icon: "🏋️",
    name: "헬스 운동 기록",
    desc: "운동 루틴 & 기록 앱",
    prompt: "헬스 운동 기록 앱을 만들어줘. 운동 타이머, 운동 종류별 기록 (가슴/등/하체/어깨), 주간 달성 현황, 연속 운동일 추적. 다크 스포티 디자인, 오렌지 포인트 컬러",
  },
  {
    id: "med-checker",
    category: "라이프",
    icon: "💊",
    name: "약 복용 체커",
    desc: "복용 알림 & 기록 앱",
    prompt: "약 복용 체커 앱을 만들어줘. 약 이름/복용 시간(아침/점심/저녁/취침전) 등록, 오늘 복용 체크, 7일 달력 기록, 달성률 프로그레스바. 그린 톤 깔끔한 디자인",
  },
];
