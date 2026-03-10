// ── Snippet Library ─────────────────────────────────────────────────────────
// Quick-insert code templates for common patterns.

export interface Snippet {
  id: string;
  category: string;
  label: string;
  description: string;
  code: string;
  language: "html" | "css" | "javascript" | "typescript";
}

/** Community snippet as returned from the API */
export interface CommunitySnippet {
  id: string;
  label: string;
  description: string | null;
  language: "html" | "css" | "javascript" | "typescript";
  category: string;
  code: string;
  likes: number;
  created_at: string;
}

export const SNIPPET_CATEGORIES = [
  "HTML", "CSS", "JavaScript", "API", "Animation", "Form", "Layout", "Utility",
] as const;

/** Extra display-only category tab used in the panel */
export const COMMUNITY_CATEGORY = "커뮤니티" as const;

// ── Community API helpers ────────────────────────────────────────────────────

/**
 * Fetch approved community snippets from the API.
 * @param category  Optional category filter
 * @param limit     Max results (default 20, max 50)
 */
export async function fetchCommunitySnippets(
  category?: string,
  limit = 20
): Promise<CommunitySnippet[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (category) params.set("category", category);

  const res = await fetch(`/api/snippets?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { snippets: CommunitySnippet[] };
  return body.snippets ?? [];
}

export interface SubmitSnippetPayload {
  label: string;
  description?: string;
  language: "html" | "css" | "javascript" | "typescript";
  category: string;
  code: string;
}

export interface SubmitSnippetResult {
  success: boolean;
  message: string;
}

/**
 * Submit a snippet to the community library (auth required).
 */
export async function submitSnippet(
  payload: SubmitSnippetPayload
): Promise<SubmitSnippetResult> {
  try {
    const res = await fetch("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { message?: string; error?: string };
    if (!res.ok) {
      return { success: false, message: body.error ?? "제출에 실패했습니다." };
    }
    return { success: true, message: body.message ?? "제출 완료!" };
  } catch {
    return { success: false, message: "네트워크 오류가 발생했습니다." };
  }
}

export const SNIPPETS: Snippet[] = [
  // ── HTML ──
  { id: "h1", category: "HTML", label: "반응형 메타 태그", description: "viewport + charset 메타",
    language: "html", code: `<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1.0" />` },
  { id: "h2", category: "HTML", label: "시맨틱 레이아웃", description: "header/main/footer 구조",
    language: "html", code: `<header>\n  <nav><!-- 네비게이션 --></nav>\n</header>\n<main>\n  <section>\n    <h2>섹션 제목</h2>\n    <p>내용</p>\n  </section>\n</main>\n<footer>\n  <p>&copy; 2026 My App</p>\n</footer>` },
  { id: "h3", category: "HTML", label: "카드 컴포넌트", description: "이미지+텍스트 카드",
    language: "html", code: `<div class="card">\n  <div class="card-img">🖼️</div>\n  <div class="card-body">\n    <h3 class="card-title">제목</h3>\n    <p class="card-text">설명 텍스트</p>\n    <button class="card-btn">자세히 보기</button>\n  </div>\n</div>` },
  { id: "h4", category: "HTML", label: "모달 다이얼로그", description: "접근성 갖춘 모달",
    language: "html", code: `<div class="modal-overlay" id="modal">\n  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">\n    <h2 id="modal-title">모달 제목</h2>\n    <p>모달 내용을 입력하세요.</p>\n    <button onclick="document.getElementById('modal').style.display='none'">닫기</button>\n  </div>\n</div>` },

  // ── CSS ──
  { id: "c1", category: "CSS", label: "CSS 변수 테마", description: ":root 변수 기반 테마",
    language: "css", code: `:root {\n  --bg: #ffffff;\n  --surface: #f9fafb;\n  --text: #1b1b1f;\n  --muted: #6b7280;\n  --accent: #f97316;\n  --radius: 12px;\n}\n[data-theme="dark"] {\n  --bg: #0d1117;\n  --surface: #161b22;\n  --text: #e6edf3;\n  --muted: #8b949e;\n}` },
  { id: "c2", category: "CSS", label: "반응형 그리드", description: "auto-fit 반응형 그리드",
    language: "css", code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 20px;\n  padding: 20px;\n}` },
  { id: "c3", category: "CSS", label: "글래스모피즘", description: "반투명 유리 효과",
    language: "css", code: `.glass {\n  background: rgba(255, 255, 255, 0.1);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);\n}` },
  { id: "c4", category: "CSS", label: "스크롤바 커스텀", description: "얇은 모던 스크롤바",
    language: "css", code: `::-webkit-scrollbar { width: 6px; }\n::-webkit-scrollbar-track { background: transparent; }\n::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }\n::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.35); }` },
  { id: "c5", category: "CSS", label: "다크 모드 토글", description: "prefers-color-scheme + 수동 전환",
    language: "css", code: `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n    --bg: #0d1117;\n    --text: #e6edf3;\n  }\n}\n[data-theme="dark"] {\n  --bg: #0d1117;\n  --text: #e6edf3;\n}` },

  // ── JavaScript ──
  { id: "j1", category: "JavaScript", label: "Fetch API 래퍼", description: "에러 처리 포함 fetch",
    language: "javascript", code: `async function api(url, options = {}) {\n  try {\n    const res = await fetch(url, {\n      headers: { "Content-Type": "application/json", ...options.headers },\n      ...options,\n    });\n    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n    return await res.json();\n  } catch (err) {\n    console.error("API 오류:", err.message);\n    return null;\n  }\n}` },
  { id: "j2", category: "JavaScript", label: "localStorage 헬퍼", description: "JSON 직렬화 래퍼",
    language: "javascript", code: `const storage = {\n  get(key, fallback = null) {\n    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }\n    catch { return fallback; }\n  },\n  set(key, value) {\n    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}\n  },\n  remove(key) { try { localStorage.removeItem(key); } catch {} },\n};` },
  { id: "j3", category: "JavaScript", label: "디바운스 함수", description: "입력 지연 처리",
    language: "javascript", code: `function debounce(fn, delay = 300) {\n  let timer;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}` },
  { id: "j4", category: "JavaScript", label: "다크 모드 토글", description: "data-theme 기반 전환",
    language: "javascript", code: `function toggleDarkMode() {\n  const html = document.documentElement;\n  const current = html.getAttribute("data-theme");\n  const next = current === "dark" ? "light" : "dark";\n  html.setAttribute("data-theme", next);\n  localStorage.setItem("theme", next);\n}\n// 초기화\nconst saved = localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");\ndocument.documentElement.setAttribute("data-theme", saved);` },

  // ── API ──
  { id: "a1", category: "API", label: "REST CRUD", description: "CRUD 엔드포인트 호출",
    language: "javascript", code: `const API_BASE = "/api";\nconst crud = {\n  list:   ()     => api(\`\${API_BASE}/items\`),\n  get:    (id)   => api(\`\${API_BASE}/items/\${id}\`),\n  create: (data) => api(\`\${API_BASE}/items\`, { method: "POST", body: JSON.stringify(data) }),\n  update: (id, data) => api(\`\${API_BASE}/items/\${id}\`, { method: "PUT", body: JSON.stringify(data) }),\n  remove: (id)   => api(\`\${API_BASE}/items/\${id}\`, { method: "DELETE" }),\n};` },
  { id: "a2", category: "API", label: "SSE 스트리밍", description: "Server-Sent Events 수신",
    language: "javascript", code: `function streamSSE(url, onData, onDone) {\n  const es = new EventSource(url);\n  es.onmessage = (e) => {\n    if (e.data === "[DONE]") { es.close(); onDone?.(); return; }\n    try { onData(JSON.parse(e.data)); } catch {}\n  };\n  es.onerror = () => { es.close(); onDone?.(); };\n  return () => es.close();\n}` },

  // ── Animation ──
  { id: "n1", category: "Animation", label: "페이드인 애니메이션", description: "CSS + JS 페이드인",
    language: "css", code: `@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(20px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n.fade-in {\n  animation: fadeIn 0.5s ease-out forwards;\n}` },
  { id: "n2", category: "Animation", label: "무한 스크롤 마퀴", description: "CSS-only 무한 스크롤",
    language: "css", code: `.marquee { overflow: hidden; white-space: nowrap; }\n.marquee-inner {\n  display: inline-block;\n  animation: scroll 15s linear infinite;\n}\n@keyframes scroll {\n  0%   { transform: translateX(0); }\n  100% { transform: translateX(-50%); }\n}` },

  // ── Form ──
  { id: "f1", category: "Form", label: "폼 유효성 검사", description: "실시간 입력 검증",
    language: "javascript", code: `function validateForm(form) {\n  const errors = {};\n  const email = form.email?.value;\n  const password = form.password?.value;\n  if (!email || !/^[^@]+@[^@]+\\.[^@]+$/.test(email)) errors.email = "유효한 이메일을 입력하세요";\n  if (!password || password.length < 8) errors.password = "비밀번호는 8자 이상이어야 합니다";\n  return { valid: Object.keys(errors).length === 0, errors };\n}` },
  { id: "f2", category: "Form", label: "모던 인풋 스타일", description: "플로팅 라벨 인풋",
    language: "css", code: `.input-group { position: relative; margin-bottom: 20px; }\n.input-group input {\n  width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb;\n  border-radius: 10px; font-size: 15px; outline: none;\n  transition: border-color 0.2s;\n}\n.input-group input:focus { border-color: #f97316; }\n.input-group label {\n  position: absolute; top: 50%; left: 14px;\n  transform: translateY(-50%); color: #6b7280;\n  transition: all 0.2s; pointer-events: none; font-size: 14px;\n}\n.input-group input:focus ~ label,\n.input-group input:not(:placeholder-shown) ~ label {\n  top: -8px; left: 12px; font-size: 11px;\n  color: #f97316; background: #fff; padding: 0 4px;\n}` },

  // ── Layout ──
  { id: "l1", category: "Layout", label: "Flexbox 센터링", description: "수직+수평 중앙 정렬",
    language: "css", code: `.center {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}` },
  { id: "l2", category: "Layout", label: "사이드바 레이아웃", description: "고정 사이드바 + 스크롤 메인",
    language: "css", code: `.layout { display: flex; min-height: 100vh; }\n.sidebar {\n  width: 260px; flex-shrink: 0;\n  background: #f9fafb; border-right: 1px solid #e5e7eb;\n  padding: 20px; overflow-y: auto;\n}\n.main {\n  flex: 1; padding: 24px; overflow-y: auto;\n}` },

  // ── Utility ──
  { id: "u1", category: "Utility", label: "날짜 포맷", description: "한국어 날짜 포매팅",
    language: "javascript", code: `function formatDate(date) {\n  const d = new Date(date);\n  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });\n}\nfunction timeAgo(date) {\n  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);\n  if (s < 60) return "방금 전";\n  if (s < 3600) return \`\${Math.floor(s/60)}분 전\`;\n  if (s < 86400) return \`\${Math.floor(s/3600)}시간 전\`;\n  return \`\${Math.floor(s/86400)}일 전\`;\n}` },
  { id: "u2", category: "Utility", label: "랜덤 ID 생성", description: "UUID-like 짧은 ID",
    language: "javascript", code: `function genId(len = 8) {\n  return Array.from(crypto.getRandomValues(new Uint8Array(len)))\n    .map(b => b.toString(36)).join("").slice(0, len);\n}` },
  { id: "u3", category: "Utility", label: "클립보드 복사", description: "텍스트 클립보드 복사",
    language: "javascript", code: `async function copyToClipboard(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    console.log("복사 완료!");\n  } catch {\n    // fallback\n    const ta = document.createElement("textarea");\n    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";\n    document.body.appendChild(ta); ta.select();\n    document.execCommand("copy"); document.body.removeChild(ta);\n  }\n}` },
];

export function getSnippetsByCategory(cat: string): Snippet[] {
  return SNIPPETS.filter(s => s.category === cat);
}

export function searchSnippets(query: string): Snippet[] {
  const q = query.toLowerCase();
  return SNIPPETS.filter(s =>
    s.label.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.code.toLowerCase().includes(q)
  );
}
