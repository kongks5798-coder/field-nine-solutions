"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIMode } from "@/lib/ai/multiAI";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { genId, saveProjectToStorage } from "@/app/workspace/stores/useProjectStore";
import {
  DEFAULT_FILES, CUR_KEY, PROJ_KEY,
} from "@/app/workspace/workspace.constants";
import type { Project } from "@/app/workspace/workspace.constants";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── AI Model Selector (prompt bar) ──────────────────────────────────────────

const AI_SELECTOR_MODELS: { value: AIMode; label: string; color: string }[] = [
  { value: "openai",    label: "GPT-4o mini",       color: "#10b981" },
  { value: "anthropic", label: "Claude Haiku 4.5",  color: "#7c3aed" },
  { value: "gemini",    label: "Gemini 1.5 Flash",  color: "#3b82f6" },
  { value: "grok",      label: "Grok 3",            color: "#111827" },
];

function AIModelSelector({ value, onChange }: { value: AIMode; onChange: (v: AIMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* 딸깍 AI 뱃지 — 클릭 시 엔진 선택 드롭다운 */}
      <button onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open} style={{
        display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20,
        border: "1.5px solid rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.1)", fontSize: 13, fontWeight: 700,
        color: "#f97316", cursor: "pointer",
      }}>
        ✦ 딸깍 AI
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}>
          <path d="M1 1l4 4 4-4" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "#1a1a1f", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 50, minWidth: 180,
        }}>
          <div style={{ padding: "8px 14px 4px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>엔진 선택</div>
          {AI_SELECTOR_MODELS.map(m => (
            <button key={m.value} onClick={() => { onChange(m.value); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
              border: "none", background: m.value === value ? "rgba(249,115,22,0.1)" : "transparent",
              fontSize: 13, fontWeight: m.value === value ? 700 : 500,
              color: m.value === value ? "#f97316" : "rgba(255,255,255,0.7)", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
              딸깍 AI {m.value === "anthropic" ? "표준" : m.value === "openai" ? "빠름" : m.value === "gemini" ? "플래시" : "실험"}
              {m.value === value && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: "auto" }}>
                  <path d="M2.5 7l3 3 6-6" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quick Example Pills ──────────────────────────────────────────────────────

const QUICK_EXAMPLES = [
  { icon: "🎮", text: "스네이크 게임" },
  { icon: "📊", text: "가계부 앱" },
  { icon: "⏱️", text: "포모도로 타이머" },
  { icon: "🛍️", text: "쇼핑몰 랜딩" },
];

// ─── Pricing (shown for logged-out users) ────────────────────────────────────

const PRICING = [
  {
    name: "\uBB34\uB8CC", price: "\u20A90", desc: "\uCC98\uC74C \uC2DC\uC791\uD558\uB294 \uBD84",
    highlight: false, cta: "\uBB34\uB8CC\uB85C \uC2DC\uC791", ctaHref: "/signup",
    features: ["AI \uC0DD\uC131 50\uD68C/\uC6D4", "\uD504\uB85C\uC81D\uD2B8 3\uAC1C", "GPT-4o mini", "\uACF5\uAC1C \uBC30\uD3EC 1\uAC1C"],
  },
  {
    name: "\uD504\uB85C", price: "\u20A939,000", original: "\u20A949,000",
    desc: "\uC804\uBB38\uAC00\uB97C \uC704\uD55C \uBB34\uC81C\uD55C \uD50C\uB79C",
    highlight: true, cta: "\uD504\uB85C \uC2DC\uC791\uD558\uAE30", ctaHref: "/pricing",
    features: ["AI \uC0DD\uC131 \uBB34\uC81C\uD55C", "\uD504\uB85C\uC81D\uD2B8 \uBB34\uC81C\uD55C", "GPT\xB7Claude\xB7Gemini\xB7Grok", "\uBE44\uACF5\uAC1C \uBC30\uD3EC \uBB34\uC81C\uD55C", "\uD300 \uD611\uC5C5 10\uBA85", "\uD074\uB77C\uC6B0\uB4DC 50GB"],
  },
  {
    name: "\uD300", price: "\u20A999,000", original: "\u20A9129,000",
    desc: "\uB300\uADDC\uBAA8 \uD300\uC744 \uC704\uD55C \uD50C\uB79C",
    highlight: false, cta: "\uD300 \uC2DC\uC791\uD558\uAE30", ctaHref: "/pricing",
    features: ["\uD504\uB85C \uBAA8\uB4E0 \uAE30\uB2A5", "\uD300\uC6D0 \uBB34\uC81C\uD55C", "\uD074\uB77C\uC6B0\uB4DC 200GB", "SSO/SAML 2.0", "\uC804\uB2F4 \uB9E4\uB2C8\uC800", "SLA 99.9%"],
  },
];


// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("anthropic");
  const [showDownload, setShowDownload] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [featuredApps, setFeaturedApps] = useState<Array<{ slug: string; name: string; views: number; likes: number; score: number | null; badge: string }>>([]);

  // Fetch featured apps ("오늘의 딸깍")
  useEffect(() => {
    fetch("/api/showcase/featured")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.featured)) setFeaturedApps(d.featured); })
      .catch(() => {});
  }, []);

  // Hub state (logged-in users)
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));

    // PWA install
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Load projects + published apps when user is available
  useEffect(() => {
    if (!user) { setProjects([]); return; }

    // Local projects
    try {
      const local = JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[];
      setProjects(local.slice(0, 4));
    } catch { /* ignore */ }

    // Server projects (merge/override)
    fetch("/api/projects")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (Array.isArray(d.projects)) setProjects(d.projects.slice(0, 4)); })
      .catch(() => { /* keep localStorage fallback */ });

  }, [user]);

  const getUserDisplay = (u: User) =>
    u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "\uC0AC\uC6A9\uC790";

  // ── handleStart: ALWAYS create a new project ────────────────────────────────
  const handleStart = (q?: string) => {
    const text = (q ?? prompt).trim();
    if (!text) return;

    // Create new project before navigating
    const newId = genId();
    const newProj: Project = {
      id: newId,
      name: (() => { const n = text.replace(/만들어줘|만들어|해줘|해주세요|주세요|please|create|make|build|generate/gi,"").replace(/[,;!?]/g,"").trim().split(/\s+/).slice(0,4).join(" ").slice(0,30); return n.length >= 2 ? n : text.slice(0, 30); })(),
      files: { ...DEFAULT_FILES },
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(newProj);
    localStorage.setItem(CUR_KEY, newId);
    // ③-A 서버 즉시 저장 (fire-and-forget)
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId, name: newProj.name, files: newProj.files, updatedAt: newProj.updatedAt }),
    }).catch(() => {});

    const url = `/workspace?q=${encodeURIComponent(text)}&mode=${aiMode}`;
    router.push(user ? url : `/login?next=${encodeURIComponent(url)}`);
  };

  const handleOpenProject = (proj: Project) => {
    localStorage.setItem(CUR_KEY, proj.id);
    router.push("/workspace");
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    setShowDownload(false);
  };

  const displayName = user ? getUserDisplay(user) : null;
  const isLoggedIn = !!user;

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f11", color: "#e8eaf0",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .home-nav { padding: 0 16px !important; }
          .home-hero { padding-top: 40px !important; padding-bottom: 32px !important; }
          .home-hero-badge { font-size: 11px !important; }
          .home-hero-sub { font-size: 14px !important; margin-bottom: 20px !important; }
          .home-prompt-textarea { font-size: 14px !important; min-height: 76px !important; padding: 14px 16px 0 !important; }
          .home-example-chips { gap: 6px !important; margin-top: 14px !important; flex-wrap: wrap !important; }
          .home-chip { font-size: 11px !important; padding: 5px 11px !important; }
          .home-section { padding: 32px 16px !important; }
          .home-footer { flex-direction: column !important; gap: 20px !important; }
          .proj-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .model-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .home-how-section { padding: 48px 20px !important; }
        }
        @media (max-width: 768px) {
          .home-nav-links { display: none !important; }
          .home-hero-title { font-size: 34px !important; }
          .home-step-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pub-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .home-hero-title { font-size: 28px !important; letter-spacing: -0.02em !important; }
          .proj-grid { grid-template-columns: 1fr !important; }
        }
        .home-navlink { text-decoration: none; }
        .home-navlink:hover { background: rgba(255,255,255,0.06); color: #e8eaf0; }
        .home-chip:hover { border-color: #f97316 !important; color: #f97316 !important; background: rgba(249,115,22,0.08) !important; }
        .home-prompt-textarea::placeholder { color: rgba(255,255,255,0.3); }
        .proj-card:hover { border-color: rgba(249,115,22,0.5) !important; background: rgba(249,115,22,0.04) !important; transform: translateY(-2px); }
        .model-card:hover { border-color: rgba(249,115,22,0.4) !important; background: rgba(249,115,22,0.04) !important; }
        .pub-card:hover { border-color: rgba(34,197,94,0.4) !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Nav ── */}
      <nav className="home-nav" style={{
        display: "flex", alignItems: "center", padding: "0 24px", height: 58,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(15,15,17,0.92)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div
          onClick={() => router.push("/")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
          role="button" tabIndex={0} aria-label="Dalkak \uD648\uC73C\uB85C \uC774\uB3D9"
          style={{
            display: "flex", alignItems: "center", gap: 9, fontWeight: 800,
            fontSize: 17, color: "#e8eaf0", cursor: "pointer", marginRight: 24, flexShrink: 0,
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>D</div>
          Dalkak
        </div>

        <div className="home-nav-links" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {isLoggedIn ? (
            <>
              <a className="home-navlink" href="/dashboard" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uB300\uC2DC\uBCF4\uB4DC"}
              </a>
              <a className="home-navlink" href="/showcase" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC1FC\uCF00\uC774\uC2A4"}
              </a>
              <a className="home-navlink" href="/workspace?template=true" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\ud15c\ud50c\ub9bf"}
              </a>
              <a className="home-navlink" href="/lm" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                LM {"\uD5C8\uBE0C"}
              </a>
            </>
          ) : (
            <>
              <a className="home-navlink" href="/showcase" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC1FC\uCF00\uC774\uC2A4"}
              </a>
              <a className="home-navlink" href="/workspace?template=true" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\ud15c\ud50c\ub9bf"}
              </a>
              <a className="home-navlink" href="#pricing" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC694\uAE08\uC81C"}
              </a>
              <a className="home-navlink" href="#how" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC791\uB3D9 \uBC29\uC2DD"}
              </a>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* App install dropdown */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowDownload(v => !v)} aria-label="\uC571 \uB9CC\uB4E4\uAE30" aria-haspopup="menu" aria-expanded={showDownload} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#e8eaf0", cursor: "pointer",
            }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v9M5 8l3 3 3-3"/><path d="M2 13h12"/>
              </svg>
              <span className="hide-mobile">{"\uC571 \uB9CC\uB4E4\uAE30"}</span>
              <svg width="9" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M1 1l4 4 4-4"/>
              </svg>
            </button>
            {showDownload && (
              <>
                <div onClick={() => setShowDownload(false)} onKeyDown={(e) => { if (e.key === "Escape") setShowDownload(false); }} role="presentation" style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "#1a1a1f", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 50, minWidth: 260,
                }}>
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#e8eaf0", marginBottom: 3 }}>{"\uD83D\uDCF2 Dalkak \uC571 \uB9CC\uB4E4\uAE30"}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{"\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\uD558\uBA74 \uC571\uCC98\uB7FC \uC0AC\uC6A9 \uAC00\uB2A5 \xB7 \uC790\uB3D9 \uC5C5\uB370\uC774\uD2B8"}</div>
                  </div>
                  {canInstall ? (
                    <button onClick={handleInstall} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "14px 16px", border: "none", background: "rgba(249,115,22,0.08)", cursor: "pointer",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>D</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{"\uC774 \uAE30\uAE30\uC5D0 \uC571 \uC124\uCE58"}</div>
                        <div style={{ fontSize: 11, color: "#9a3412" }}>{"\uD074\uB9AD \uD55C \uBC88\uC73C\uB85C \uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00"}</div>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 2 }}>
                      {"\uD83D\uDCF1"} <b>iPhone/iPad</b> {"\u2192 Safari \u2192 \uACF5\uC720 \u2192 \uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00"}<br/>
                      {"\uD83E\uDD16"} <b>Android</b> {"\u2192 Chrome \u2192 \uBA54\uB274 \u2192 \uC571 \uC124\uCE58"}<br/>
                      {"\uD83D\uDCBB"} <b>PC</b> {"\u2192 Chrome \uC8FC\uC18C\uCC3D \uC6B0\uCE21 "}<b>{"\u2295"}</b>{" \uBC84\uD2BC"}
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 600 }}>{"\uB370\uC2A4\uD06C\uD1B1 \uC571 (\uCD9C\uC2DC \uC608\uC815)"}</div>
                    {[{ os: "Windows", icon: "\uD83E\uDE9F" }, { os: "macOS", icon: "\uD83C\uDF4E" }, { os: "Linux", icon: "\uD83D\uDC27" }].map(({ os, icon }) => (
                      <div key={os} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", opacity: 0.45 }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{os} {"\xB7 \uC900\uBE44 \uC911"}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <a href="/workspace" onClick={() => setShowDownload(false)} style={{
                      display: "block", textAlign: "center", padding: "9px 0", borderRadius: 8,
                      background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff",
                      fontSize: 13, fontWeight: 700, textDecoration: "none",
                    }}>
                      {"\uC9C0\uAE08 \uC6F9\uC5D0\uC11C \uC2DC\uC791\uD558\uAE30 \u2192"}
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", fontSize: 13, color: "#e8eaf0" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {displayName!.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600 }} className="hide-mobile">{displayName}</span>
              </div>
            </>
          ) : (
            <>
              <a href="/login" className="hide-mobile" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.12)", background: "transparent" }}>
                {"\uB85C\uADF8\uC778"}
              </a>
              <a href="/signup" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)", whiteSpace: "nowrap" }}>
                {"\uBB34\uB8CC \uC2DC\uC791"}
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero / Prompt ── */}
      <section className="home-hero" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: isLoggedIn ? 48 : 72, paddingBottom: isLoggedIn ? 32 : 64, paddingLeft: 24, paddingRight: 24,
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.12) 0%, transparent 70%)",
      }}>
        {!isLoggedIn && (
          <div className="home-hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 22,
            padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(249,115,22,0.06)", fontSize: 12, fontWeight: 600, color: "#c2410c",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            GPT-4o {"\xB7"} Claude 4.6 {"\xB7"} Gemini {"\xB7"} Grok 3 {"실시간 사용 가능"}
          </div>
        )}

        <h1 className="home-hero-title" style={{
          fontSize: isLoggedIn ? 40 : 56, fontWeight: 900, color: "#f0f0f4", textAlign: "center",
          lineHeight: 1.08, marginBottom: isLoggedIn ? 10 : 16, letterSpacing: "-0.03em", maxWidth: 820,
        }}>
          {isLoggedIn ? (
            <>{"\uBB34\uC5C7\uC744 "}<span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{"\uB9CC\uB4E4\uAE4C\uC694?"}</span></>
          ) : (
            <>{"\uB9D0\uD558\uBA74 \uBC14\uB85C"}<br /><span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{"\uC571\uC774 \uB9CC\uB4E4\uC5B4\uC9D1\uB2C8\uB2E4"}</span></>
          )}
        </h1>

        {!isLoggedIn && (
          <>
            <p className="home-hero-sub" style={{
              fontSize: 17, color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: 20,
              fontWeight: 400, lineHeight: 1.65, maxWidth: 560,
            }}>
              {"프롬프트 한 줄로 웹앱 완성 — 레플릿보다 빠르게, Bolt보다 한국어로"}
            </p>
            {/* Social proof */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
              padding: "8px 18px", borderRadius: 20,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex" }}>
                {["\uD83E\uDDD1\u200D\uD83D\uDCBB","\uD83D\uDC69\u200D\uD83D\uDCBB","\uD83E\uDDD1\u200D\uD83C\uDFA8","\uD83D\uDC68\u200D\uD83D\uDE80","\uD83E\uDDD1\u200D\uD83D\uDD2C"].map((e, i) => (
                  <span key={i} style={{ fontSize: 16, marginLeft: i === 0 ? 0 : -4 }}>{e}</span>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                <b style={{ color: "#f97316" }}>5,000+</b> {"\uAC1C\uBC1C\uC790\uAC00 \uC774\uBBF8 \uC0AC\uC6A9 \uC911"}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite", flexShrink: 0, display: "inline-block" }} />
            </div>
            {/* 1분 promise stats */}
            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
              {[
                { n: "60초", label: "평균 완성 시간" },
                { n: "49+", label: "완성 템플릿" },
                { n: "3가지", label: "AI 모델 지원" },
              ].map(({ n, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f97316" }}>{n}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {isLoggedIn && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 24 }}>
            {"\uD504\uB86C\uD504\uD2B8\uB97C \uC785\uB825\uD558\uBA74 \uC0C8 \uD504\uB85C\uC81D\uD2B8\uAC00 \uC0DD\uC131\uB429\uB2C8\uB2E4"}
          </p>
        )}

        {/* Prompt box */}
        <div style={{
          width: "100%", maxWidth: 740, background: "#1a1a1f",
          border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)", overflow: "hidden",
        }}>
          <textarea
            className="home-prompt-textarea"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
            placeholder={"\uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uC571\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694... (\uC608: \uD14C\uD2B8\uB9AC\uC2A4 \uAC8C\uC784 \uB9CC\uB4E4\uC5B4\uC918)"}
            style={{
              width: "100%", padding: "18px 20px 0", fontSize: 15, color: "#e8eaf0",
              border: "none", outline: "none", resize: "none", minHeight: 80, background: "transparent",
              fontFamily: "inherit", lineHeight: 1.65, boxSizing: "border-box",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", gap: 8,
          }}>
            <AIModelSelector value={aiMode} onChange={setAiMode} />
            <button
              onClick={() => handleStart()}
              disabled={!prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
                borderRadius: 10, border: "none", flexShrink: 0,
                background: !prompt.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: !prompt.trim() ? "rgba(255,255,255,0.3)" : "#fff", fontSize: 14, fontWeight: 700,
                cursor: !prompt.trim() ? "not-allowed" : "pointer",
                boxShadow: !prompt.trim() ? "none" : "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              {"\uB9CC\uB4E4\uAE30"}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Example Pills */}
        <div className="home-example-chips" style={{
          display: "flex", gap: 8, marginTop: 16, justifyContent: "center", flexWrap: "wrap",
        }}>
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex.text}
              className="home-chip"
              onClick={() => handleStart(ex.text)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 22, fontSize: 13, fontWeight: 500,
                border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span>{ex.icon}</span>
              <span>{ex.text}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          LOGGED-IN HUB: Recent Projects (mini) + AI Models
         ══════════════════════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px 64px" }}>

          {/* ── Recent Projects (mini 2×2) ── */}
          {projects.length > 0 && (
            <section style={{ marginBottom: 32, animation: "fadeUp 0.4s ease-out" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{"최근 프로젝트"}</h2>
                <a href="/dashboard" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                  {"전체 보기 →"}
                </a>
              </div>
              <div className="proj-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10,
              }}>
                {projects.slice(0, 4).map((proj, i) => {
                  const CARD_GRADIENTS = [
                    "linear-gradient(135deg,#667eea,#764ba2)",
                    "linear-gradient(135deg,#f97316,#f43f5e)",
                    "linear-gradient(135deg,#06b6d4,#3b82f6)",
                    "linear-gradient(135deg,#10b981,#059669)",
                  ];
                  const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
                  const updAt = proj.updatedAt ? new Date(proj.updatedAt) : null;
                  const dateStr = updAt && !isNaN(updAt.getTime()) ? updAt.toLocaleDateString("ko-KR") : "";
                  return (
                    <div
                      key={proj.id}
                      className="proj-card"
                      onClick={() => handleOpenProject(proj)}
                      style={{
                        borderRadius: 12, cursor: "pointer", overflow: "hidden",
                        border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{ height: 52, background: grad, opacity: 0.8 }} />
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: "#e8eaf0", marginBottom: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                          {dateStr || "방금 전"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── AI Models Banner ── */}
          <section style={{ animation: "fadeUp 0.4s ease-out 0.1s both" }}>
            <a href="/lm" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px", borderRadius: 16,
              background: "linear-gradient(135deg,rgba(249,115,22,0.06) 0%,rgba(168,85,247,0.06) 100%)",
              border: "1.5px solid rgba(249,115,22,0.15)", textDecoration: "none",
              transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["#60a5fa","GPT"], ["#a855f7","Claude"], ["#f97316","Gemini"], ["#374151","Grok"]].map(([c, n]) => (
                    <span key={n} style={{ width: 32, height: 32, borderRadius: 8, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{n}</span>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e8eaf0" }}>GPT-4o · Claude 4.6 · Gemini · Grok 3</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>LM 허브에서 모든 AI 모델 비교 · 성능 테스트 가능</div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316", whiteSpace: "nowrap" }}>LM 허브 →</span>
            </a>
          </section>

          {/* ── 오늘의 딸깍 Featured ── */}
          {featuredApps.length > 0 && (
            <section style={{ marginTop: 32, animation: "fadeUp 0.4s ease-out 0.15s both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{"✨ 오늘의 딸깍"}</h2>
                <a href="/showcase" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>{"전체 보기 →"}</a>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {featuredApps.map((app, i) => {
                  const CARD_GRADIENTS = [
                    "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 100%)",
                    "linear-gradient(135deg, rgba(148,163,184,0.15) 0%, rgba(100,116,139,0.08) 100%)",
                    "linear-gradient(135deg, rgba(205,127,50,0.15) 0%, rgba(180,100,30,0.08) 100%)",
                    "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.08) 100%)",
                    "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.08) 100%)",
                  ];
                  const BORDER_COLORS = [
                    "rgba(251,191,36,0.3)", "rgba(148,163,184,0.3)", "rgba(205,127,50,0.3)",
                    "rgba(249,115,22,0.3)", "rgba(168,85,247,0.3)",
                  ];
                  return (
                    <div key={app.slug} style={{
                      minWidth: 180, flexShrink: 0, borderRadius: 14,
                      border: `1.5px solid ${BORDER_COLORS[i] ?? BORDER_COLORS[4]}`,
                      background: CARD_GRADIENTS[i] ?? CARD_GRADIENTS[4],
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{app.badge}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>{app.name}</div>
                        <button onClick={() => window.open(`/p/${app.slug}`, "_blank")} style={{
                          width: "100%", padding: "7px 0", borderRadius: 8, border: "none",
                          background: "rgba(255,255,255,0.1)", color: "#e8eaf0",
                          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>{"열기"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          LOGGED-OUT: Marketing sections (How It Works, Pricing, CTA)
         ══════════════════════════════════════════════════════════════════════════ */}
      {!isLoggedIn && (
        <>
          {/* How It Works */}
          <section className="home-how-section" id="how" style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{"\uC791\uB3D9 \uBC29\uC2DD"}</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f0f0f4", letterSpacing: "-0.02em" }}>{"3\uB2E8\uACC4\uB85C \uC644\uC131"}</h2>
            </div>
            <div className="home-step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 48 }}>
              {[
                { step: "01", icon: "\uD83D\uDCAC", title: "\uC544\uC774\uB514\uC5B4 \uC785\uB825", desc: "\uD55C\uAD6D\uC5B4\uB85C \uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uAC78 \uC124\uBA85\uD558\uC138\uC694. \uC544\uB798 \uC608\uC2DC\uB97C \uD074\uB9AD\uD574\uB3C4 \uB429\uB2C8\uB2E4." },
                { step: "02", icon: "\uD83E\uDD16", title: "AI\uAC00 \uCF54\uB4DC \uC791\uC131", desc: "\uC120\uD0DD\uD55C AI \uBAA8\uB378\uC774 HTML\xB7CSS\xB7JS\uB97C \uC790\uB3D9 \uC0DD\uC131\uD558\uACE0 \uB514\uBC84\uAE45\uAE4C\uC9C0 \uC644\uB8CC\uD569\uB2C8\uB2E4." },
                { step: "03", icon: "\uD83D\uDE80", title: "\uC989\uC2DC \uBC30\uD3EC\xB7\uACF5\uC720", desc: "\uD55C \uD074\uB9AD\uC73C\uB85C \uACF5\uC720 \uB9C1\uD06C \uC0DD\uC131. \uC5C5\uB370\uC774\uD2B8\uB418\uBA74 \uC790\uB3D9\uC73C\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4." },
              ].map(s => (
                <div key={s.step} style={{ textAlign: "center", padding: "32px 24px", borderRadius: 18, border: "1.5px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: 38, marginBottom: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#f97316", letterSpacing: "0.08em", marginBottom: 8 }}>STEP {s.step}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#f0f0f4", marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Competitor Comparison Table ── */}
          <section style={{ background: "#0a0a0c", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "72px 24px" }}>
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{"비교"}</p>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f0f0f4", letterSpacing: "-0.02em" }}>{"Dalkak vs 경쟁사"}</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      {["기능", "Dalkak", "Replit", "Bolt.new"].map((h, i) => (
                        <th key={h} style={{
                          padding: "14px 18px", textAlign: i === 0 ? "left" : "center",
                          fontSize: 13, fontWeight: 700,
                          color: i === 1 ? "#f97316" : "rgba(255,255,255,0.55)",
                          borderBottom: "2px solid rgba(255,255,255,0.08)",
                          background: i === 1 ? "rgba(249,115,22,0.06)" : "transparent",
                          borderRadius: i === 1 ? "8px 8px 0 0" : 0,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "한국어 지원", dalkak: true, replit: false, bolt: false },
                      { feature: "무료 플랜", dalkak: true, replit: true, bolt: false },
                      { feature: "AI 코드 생성", dalkak: true, replit: true, bolt: true },
                      { feature: "즉시 공유", dalkak: true, replit: true, bolt: true },
                      { feature: "월 가격", dalkak: "무료~₩39K", replit: "$20~", bolt: "$20~" },
                    ].map((row, ri) => (
                      <tr key={row.feature} style={{ background: ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ padding: "13px 18px", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{row.feature}</td>
                        {[row.dalkak, row.replit, row.bolt].map((val, ci) => (
                          <td key={ci} style={{
                            padding: "13px 18px", textAlign: "center",
                            background: ci === 0 ? "rgba(249,115,22,0.04)" : "transparent",
                            fontWeight: ci === 0 ? 700 : 400,
                          }}>
                            {typeof val === "boolean"
                              ? <span style={{ fontSize: 16, color: val ? "#22c55e" : "#f85149" }}>{val ? "✅" : "❌"}</span>
                              : <span style={{ fontSize: 13, color: ci === 0 ? "#f97316" : "rgba(255,255,255,0.45)" }}>{val}</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── Testimonials ── */}
          <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{"사용자 후기"}</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f0f0f4", letterSpacing: "-0.02em" }}>{"실제 사용자들의 이야기"}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {[
                { quote: "리니지 같은 RPG를 5분 만에 만들었어요!", author: "김개발", role: "인디 게임 개발자", emoji: "🎮" },
                { quote: "쇼핑몰 프로토타입을 3분 만에 완성!", author: "이스타트업", role: "창업자", emoji: "🛒" },
                { quote: "디자인부터 배포까지 혼자 다 됩니다", author: "박프리랜서", role: "프리랜서 개발자", emoji: "🚀" },
              ].map(t => (
                <div key={t.author} style={{
                  padding: "26px 24px", borderRadius: 18,
                  border: "1.5px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{t.emoji}</div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f4", lineHeight: 1.6, marginBottom: 16 }}>
                    {"\u201C"}{t.quote}{"\u201D"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg, #f97316, #f43f5e)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
                    }}>
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0" }}>{t.author} {"님"}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" style={{ background: "#0a0a0c", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "72px 24px" }}>
            <div style={{ maxWidth: 940, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 44 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{"\uC694\uAE08\uC81C"}</p>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: "#f0f0f4", letterSpacing: "-0.02em", marginBottom: 10 }}>{"\uD22C\uBA85\uD55C \uAC00\uACA9"}</h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{"14\uC77C \uBB34\uB8CC \uCCB4\uD5D8 \xB7 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C \xB7 \uC2E0\uC6A9\uCE74\uB4DC \uBD88\uD544\uC694"}</p>
              </div>
              <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {PRICING.map(plan => (
                  <div key={plan.name} style={{
                    background: plan.highlight ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.03)",
                    border: plan.highlight ? "2px solid #f97316" : "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 18, padding: "26px 22px", position: "relative",
                    boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.2)" : "none",
                  }}>
                    {plan.highlight && (
                      <div style={{ position: "absolute", top: 12, right: 14, background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{"\uC778\uAE30"}</div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f4", marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>{plan.desc}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#f0f0f4", marginBottom: 3 }}>
                      {plan.price}<span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>/{"월"}</span>
                    </div>
                    {plan.original
                      ? <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textDecoration: "line-through", marginBottom: 18 }}>{plan.original}</div>
                      : <div style={{ marginBottom: 18 }} />
                    }
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="7" cy="7" r="6.5" fill={plan.highlight ? "#f97316" : "#22c55e"}/>
                            <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {f}
                        </div>
                      ))}
                    </div>
                    <a href={plan.ctaHref} style={{
                      display: "block", padding: "11px 0", borderRadius: 10, textAlign: "center",
                      textDecoration: "none", fontSize: 13, fontWeight: 700,
                      background: plan.highlight ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)" : "rgba(255,255,255,0.08)",
                      color: plan.highlight ? "#fff" : "rgba(255,255,255,0.7)",
                      boxShadow: plan.highlight ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
                    }}>
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section style={{ background: "linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #7c3aed 100%)", padding: "64px 24px", textAlign: "center" }}>
            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>
                {"\uC9C0\uAE08 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694"}
              </h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.7 }}>
                {"\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uACE0 5\uBD84 \uC548\uC5D0 \uCCAB \uBC88\uC9F8 \uC571\uC744 \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694."}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/signup" style={{ padding: "13px 28px", borderRadius: 12, background: "#fff", color: "#f97316", textDecoration: "none", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                  {"\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30 \u2192"}
                </a>
                <a href="/pricing" style={{ padding: "13px 28px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700 }}>
                  {"\uC694\uAE08\uC81C \uBCF4\uAE30"}
                </a>
              </div>
              <p style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                Google 또는 Kakao로 바로 시작하세요 — 비밀번호 불필요
              </p>
            </div>
          </section>
        </>
      )}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0c",
        padding: "40px 24px 24px",
      }}>
        <div className="home-footer" style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: 24, marginBottom: 32,
        }}>
          <div>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 9, fontWeight: 800,
                fontSize: 17, color: "#e8eaf0", cursor: "pointer", marginBottom: 12,
              }}
              onClick={() => router.push("/")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
              role="button" tabIndex={0} aria-label="Dalkak 홈으로 이동"
            >
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 13, color: "#fff",
              }}>D</div>
              Dalkak
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", maxWidth: 200, lineHeight: 1.7 }}>
              {"AI 에이전트로 빠르게 앱을 만들고"}<br />{"스마트하게 배포하세요."}
            </p>
            {/* Social links */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <a href="https://github.com/fieldnine" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none",
                transition: "all 0.15s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
              <a href="https://twitter.com/dalkak_io" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)", fontSize: 14, textDecoration: "none",
                transition: "all 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{"서비스"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { href: "/workspace", label: "워크스페이스" },
                  { href: "/lm",        label: "LM 허브" },
                  { href: "/gallery",   label: "갤러리" },
                  { href: "/pricing",   label: "요금제" },
                  { href: "/showcase",  label: "쇼케이스" },
                ].map(l => (
                  <a key={l.href} href={l.href} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{"회사"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { href: "/about",                        label: "서비스 소개" },
                  { href: "/pricing",                      label: "요금제" },
                  { href: "/privacy",                      label: "개인정보처리방침" },
                  { href: "/terms",                        label: "이용약관" },
                  { href: "mailto:support@fieldnine.io",   label: "문의하기" },
                ].map(l => (
                  <a key={l.href} href={l.href} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{"© 2026 FieldNine Inc. All rights reserved."}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{"Made with ❤️ in Seoul, Korea"}</p>
        </div>
      </footer>
    </div>
  );
}
