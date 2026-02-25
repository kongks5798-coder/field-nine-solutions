"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIMode } from "@/lib/ai/multiAI";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { genId, saveProjectToStorage } from "@/app/workspace/stores/useProjectStore";
import {
  DEFAULT_FILES, CUR_KEY, PROJ_KEY,
  AI_MODELS as WS_AI_MODELS,
  PROVIDER_COLORS,
} from "@/app/workspace/workspace.constants";
import type { Project } from "@/app/workspace/workspace.constants";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PublishedApp = { slug: string; name: string; views: number; created_at: string };

// ─── AI Model Selector (prompt bar) ──────────────────────────────────────────

const AI_SELECTOR_MODELS: { value: AIMode; label: string; color: string }[] = [
  { value: "openai",    label: "GPT-4o mini",       color: "#10b981" },
  { value: "anthropic", label: "Claude 3.5 Sonnet", color: "#7c3aed" },
  { value: "gemini",    label: "Gemini 1.5 Flash",  color: "#3b82f6" },
  { value: "grok",      label: "Grok 3",            color: "#111827" },
];

function AIModelSelector({ value, onChange }: { value: AIMode; onChange: (v: AIMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = AI_SELECTOR_MODELS.find(m => m.value === value) ?? AI_SELECTOR_MODELS[0];
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open} style={{
        display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 20,
        border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 12, fontWeight: 600,
        color: "#374151", cursor: "pointer",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: current.color, flexShrink: 0 }} />
        {current.label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4 }}>
          <path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 50, minWidth: 200,
        }}>
          {AI_SELECTOR_MODELS.map(m => (
            <button key={m.value} onClick={() => { onChange(m.value); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
              border: "none", background: m.value === value ? "#fff7ed" : "#fff",
              fontSize: 13, fontWeight: m.value === value ? 700 : 500,
              color: m.value === value ? "#ea580c" : "#374151", cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
              {m.label}
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

// ─── Example Prompts ─────────────────────────────────────────────────────────

const EXAMPLES = [
  { icon: "\uD83C\uDFAE", text: "\uD14C\uD2B8\uB9AC\uC2A4 \uAC8C\uC784 \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDCF9", text: "\uC720\uD29C\uBE0C \uC21F\uCE20 \uC790\uB3D9\uC0DD\uC131\uAE30 \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDED2", text: "\uC1FC\uD551\uBAB0 \uACB0\uC81C \uC571 \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDCCA", text: "\uC2E4\uC2DC\uAC04 \uB300\uC2DC\uBCF4\uB4DC \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDCAC", text: "AI \uCC57\uBD07 \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDCC5", text: "\uC628\uB77C\uC778 \uC608\uC57D \uAD00\uB9AC \uC2DC\uC2A4\uD15C \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83D\uDCB0", text: "\uAC00\uACC4\uBD80 & \uC9C0\uCD9C \uBD84\uC11D\uAE30 \uB9CC\uB4E4\uC5B4\uC918" },
  { icon: "\uD83C\uDFB5", text: "\uC74C\uC545 \uD50C\uB808\uC774\uC5B4 \uB9CC\uB4E4\uC5B4\uC918" },
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

// ─── Featured AI Models for hub section ──────────────────────────────────────

const FEATURED_MODELS = WS_AI_MODELS.filter(m =>
  ["gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.0-flash", "grok-3", "claude-opus-4-6", "gpt-4o"].includes(m.id)
);

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("openai");
  const [activeAutonomy, setActiveAutonomy] = useState("high");
  const [showDownload, setShowDownload] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Hub state (logged-in users)
  const [projects, setProjects] = useState<Project[]>([]);
  const [published, setPublished] = useState<PublishedApp[]>([]);

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
    if (!user) { setProjects([]); setPublished([]); return; }

    // Local projects
    try {
      const local = JSON.parse(localStorage.getItem(PROJ_KEY) ?? "[]") as Project[];
      setProjects(local.slice(0, 8));
    } catch { /* ignore */ }

    // Server projects (merge/override)
    fetch("/api/projects")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (Array.isArray(d.projects)) setProjects(d.projects.slice(0, 8)); })
      .catch(() => { /* keep localStorage fallback */ });

    // Published apps
    fetch("/api/published?limit=4&sort=views")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.apps)) setPublished(d.apps); })
      .catch(() => {});
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
      name: text.slice(0, 30),
      files: { ...DEFAULT_FILES },
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(newProj);
    localStorage.setItem(CUR_KEY, newId);

    const url = `/workspace?q=${encodeURIComponent(text)}&mode=${aiMode}&autonomy=${activeAutonomy}`;
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
      minHeight: "100vh", background: "#fff", color: "#1b1b1f",
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
          .home-example-chips { gap: 6px !important; margin-top: 14px !important; }
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
        .home-navlink:hover { background: #f3f4f6; color: #111; }
        .home-chip:hover { border-color: #f97316; color: #ea580c; background: #fff7ed; }
        .home-prompt-textarea::placeholder { color: #b0b8c4; }
        .proj-card:hover { border-color: rgba(249,115,22,0.5) !important; background: #fffbf7 !important; transform: translateY(-2px); }
        .model-card:hover { border-color: rgba(249,115,22,0.4) !important; background: #fffbf7 !important; }
        .pub-card:hover { border-color: rgba(34,197,94,0.4) !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Nav ── */}
      <nav className="home-nav" style={{
        display: "flex", alignItems: "center", padding: "0 24px", height: 58,
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div
          onClick={() => router.push("/")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
          role="button" tabIndex={0} aria-label="Dalkak \uD648\uC73C\uB85C \uC774\uB3D9"
          style={{
            display: "flex", alignItems: "center", gap: 9, fontWeight: 800,
            fontSize: 17, color: "#1b1b1f", cursor: "pointer", marginRight: 24, flexShrink: 0,
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
              <a className="home-navlink" href="/dashboard" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uB300\uC2DC\uBCF4\uB4DC"}
              </a>
              <a className="home-navlink" href="/lm" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                LM {"\uD5C8\uBE0C"}
              </a>
              <a className="home-navlink" href="/gallery" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uAC24\uB7EC\uB9AC"}
              </a>
            </>
          ) : (
            <>
              <a className="home-navlink" href="#how" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC791\uB3D9 \uBC29\uC2DD"}
              </a>
              <a className="home-navlink" href="#pricing" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uC694\uAE08\uC81C"}
              </a>
              <a className="home-navlink" href="/gallery" style={{ padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563", fontWeight: 500, cursor: "pointer", transition: "all 0.12s" }}>
                {"\uAC24\uB7EC\uB9AC"}
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
              border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer",
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
                  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 50, minWidth: 260,
                }}>
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1b1b1f", marginBottom: 3 }}>{"\uD83D\uDCF2 Dalkak \uC571 \uB9CC\uB4E4\uAE30"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{"\uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00\uD558\uBA74 \uC571\uCC98\uB7FC \uC0AC\uC6A9 \uAC00\uB2A5 \xB7 \uC790\uB3D9 \uC5C5\uB370\uC774\uD2B8"}</div>
                  </div>
                  {canInstall ? (
                    <button onClick={handleInstall} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "14px 16px", border: "none", background: "#fff7ed", cursor: "pointer",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>D</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{"\uC774 \uAE30\uAE30\uC5D0 \uC571 \uC124\uCE58"}</div>
                        <div style={{ fontSize: 11, color: "#9a3412" }}>{"\uD074\uB9AD \uD55C \uBC88\uC73C\uB85C \uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00"}</div>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", lineHeight: 2 }}>
                      {"\uD83D\uDCF1"} <b>iPhone/iPad</b> {"\u2192 Safari \u2192 \uACF5\uC720 \u2192 \uD648 \uD654\uBA74\uC5D0 \uCD94\uAC00"}<br/>
                      {"\uD83E\uDD16"} <b>Android</b> {"\u2192 Chrome \u2192 \uBA54\uB274 \u2192 \uC571 \uC124\uCE58"}<br/>
                      {"\uD83D\uDCBB"} <b>PC</b> {"\u2192 Chrome \uC8FC\uC18C\uCC3D \uC6B0\uCE21 "}<b>{"\u2295"}</b>{" \uBC84\uD2BC"}
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid #f0f0f0", padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>{"\uB370\uC2A4\uD06C\uD1B1 \uC571 (\uCD9C\uC2DC \uC608\uC815)"}</div>
                    {[{ os: "Windows", icon: "\uD83E\uDE9F" }, { os: "macOS", icon: "\uD83C\uDF4E" }, { os: "Linux", icon: "\uD83D\uDC27" }].map(({ os, icon }) => (
                      <div key={os} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", opacity: 0.45 }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{os} {"\xB7 \uC900\uBE44 \uC911"}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f0" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, background: "#f3f4f6", fontSize: 13, color: "#374151" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {displayName!.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600 }} className="hide-mobile">{displayName}</span>
              </div>
            </>
          ) : (
            <>
              <a href="/login" className="hide-mobile" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: "#374151", border: "1.5px solid #e5e7eb", background: "#fff" }}>
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
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.09) 0%, transparent 70%)",
      }}>
        {!isLoggedIn && (
          <div className="home-hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 22,
            padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)",
            background: "rgba(249,115,22,0.06)", fontSize: 12, fontWeight: 600, color: "#c2410c",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
            GPT-4o {"\xB7"} Claude 3.5 {"\xB7"} Gemini {"\xB7"} Grok 3 {"\uC2E4\uC2DC\uAC04 \uC0AC\uC6A9 \uAC00\uB2A5"}
          </div>
        )}

        <h1 className="home-hero-title" style={{
          fontSize: isLoggedIn ? 40 : 56, fontWeight: 900, color: "#0f0f11", textAlign: "center",
          lineHeight: 1.08, marginBottom: isLoggedIn ? 10 : 16, letterSpacing: "-0.03em", maxWidth: 820,
        }}>
          {isLoggedIn ? (
            <>{"\uBB34\uC5C7\uC744 "}<span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{"\uB9CC\uB4E4\uAE4C\uC694?"}</span></>
          ) : (
            <>{"\uB9D0\uD558\uBA74 \uBC14\uB85C"}<br /><span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{"\uC571\uC774 \uB9CC\uB4E4\uC5B4\uC9D1\uB2C8\uB2E4"}</span></>
          )}
        </h1>

        {!isLoggedIn && (
          <p className="home-hero-sub" style={{
            fontSize: 17, color: "#6b7280", textAlign: "center", marginBottom: 32,
            fontWeight: 400, lineHeight: 1.65, maxWidth: 500,
          }}>
            {"\uC124\uBA85\uB9CC \uD558\uBA74 \uB429\uB2C8\uB2E4. AI\uAC00 \uCF54\uB4DC \uC791\uC131\xB7\uB514\uBC84\uAE45\xB7\uBC30\uD3EC\uAE4C\uC9C0"}<br className="hide-mobile" />
            {"\uCC98\uB9AC\uD569\uB2C8\uB2E4. \uCF54\uB529 \uC9C0\uC2DD\uC774 \uC5C6\uC5B4\uB3C4 \uB429\uB2C8\uB2E4."}
          </p>
        )}

        {isLoggedIn && (
          <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24 }}>
            {"\uD504\uB86C\uD504\uD2B8\uB97C \uC785\uB825\uD558\uBA74 \uC0C8 \uD504\uB85C\uC81D\uD2B8\uAC00 \uC0DD\uC131\uB429\uB2C8\uB2E4"}
          </p>
        )}

        {/* Prompt box */}
        <div style={{
          width: "100%", maxWidth: 740, background: "#fff",
          border: "1.5px solid #e5e7eb", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
        }}>
          <textarea
            className="home-prompt-textarea"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
            placeholder={"\uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uC571\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694... (\uC608: \uD14C\uD2B8\uB9AC\uC2A4 \uAC8C\uC784 \uB9CC\uB4E4\uC5B4\uC918)"}
            style={{
              width: "100%", padding: "18px 20px 0", fontSize: 15, color: "#1b1b1f",
              border: "none", outline: "none", resize: "none", minHeight: 80,
              fontFamily: "inherit", lineHeight: 1.65, boxSizing: "border-box",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", gap: 8, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <AIModelSelector value={aiMode} onChange={setAiMode} />
              <div style={{ display: "flex", gap: 3, background: "#f3f4f6", borderRadius: 20, padding: "3px 4px" }}>
                {[
                  { id: "low",    label: "Low",  color: "#60a5fa" },
                  { id: "medium", label: "Mid",  color: "#a78bfa" },
                  { id: "high",   label: "High", color: "#f97316" },
                  { id: "max",    label: "Max",  color: "#f43f5e" },
                ].map(a => (
                  <button key={a.id} onClick={() => setActiveAutonomy(a.id)} style={{
                    padding: "4px 10px", borderRadius: 16, border: "none", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.12s",
                    background: activeAutonomy === a.id ? "#fff" : "transparent",
                    color: activeAutonomy === a.id ? a.color : "#6b7280",
                    boxShadow: activeAutonomy === a.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}>
                    {a.label}
                  </button>
                ))}
              </div>
              <span className="hide-mobile" style={{ fontSize: 11, color: "#9ca3af" }}>{"\uC790\uC728\uC131"}</span>
            </div>
            <button
              onClick={() => handleStart()}
              disabled={!prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
                borderRadius: 10, border: "none", flexShrink: 0,
                background: !prompt.trim() ? "#f3f4f6" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: !prompt.trim() ? "#9ca3af" : "#fff", fontSize: 14, fontWeight: 700,
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

        {/* Example chips */}
        <div className="home-example-chips" style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, maxWidth: 740, justifyContent: "center",
        }}>
          {EXAMPLES.map((ex) => (
            <button className="home-chip" key={ex.text} onClick={() => setPrompt(ex.text)} style={{
              padding: "7px 14px", borderRadius: 20, border: "1.5px solid #e5e7eb",
              fontSize: 12, fontWeight: 600, color: "#4b5563", background: "#fff",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {ex.icon} {ex.text}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          LOGGED-IN HUB: Projects + AI Models + Published Apps
         ══════════════════════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 64px" }}>

          {/* ── Recent Projects ── */}
          <section className="home-section" style={{ marginBottom: 48, animation: "fadeUp 0.4s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f11" }}>{"\uCD5C\uADFC \uD504\uB85C\uC81D\uD2B8"}</h2>
              <a href="/dashboard" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                {"\uC804\uCCB4 \uBCF4\uAE30 \u2192"}
              </a>
            </div>

            {projects.length === 0 ? (
              <div style={{
                padding: "40px 24px", borderRadius: 16,
                border: "1.5px dashed #e5e7eb", background: "#fafafa", textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{"\uD83D\uDCBB"}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1b1b1f", marginBottom: 6 }}>{"\uCCAB \uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694!"}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{"\uC704\uC5D0\uC11C \uD504\uB86C\uD504\uD2B8\uB97C \uC785\uB825\uD558\uBA74 AI\uAC00 \uC571\uC744 \uB9CC\uB4E4\uC5B4\uB4DC\uB9BD\uB2C8\uB2E4."}</div>
              </div>
            ) : (
              <div className="proj-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12,
              }}>
                {projects.map(proj => (
                  <div
                    key={proj.id}
                    className="proj-card"
                    onClick={() => handleOpenProject(proj)}
                    style={{
                      padding: "18px 16px", borderRadius: 14, cursor: "pointer",
                      border: "1.5px solid #e5e7eb", background: "#fff",
                      transition: "all 0.18s",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{"\uD83D\uDCBB"}</div>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: "#1b1b1f", marginBottom: 4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {proj.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                      {" \xB7 "}
                      {Object.keys(proj.files || {}).length}{"\uAC1C \uD30C\uC77C"}
                    </div>
                  </div>
                ))}

                {/* New project card */}
                <div
                  className="proj-card"
                  onClick={() => { const newProj = { id: genId(), name: "\uC0C8 \uD504\uB85C\uC81D\uD2B8", files: { ...DEFAULT_FILES }, updatedAt: new Date().toISOString() }; saveProjectToStorage(newProj); localStorage.setItem(CUR_KEY, newProj.id); router.push("/workspace"); }}
                  style={{
                    padding: "18px 16px", borderRadius: 14, cursor: "pointer",
                    border: "1.5px dashed #e5e7eb", background: "#fafafa",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    minHeight: 110, transition: "all 0.18s",
                  }}
                >
                  <div style={{ fontSize: 28, color: "#9ca3af", marginBottom: 4 }}>+</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>{"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}</div>
                </div>
              </div>
            )}
          </section>

          {/* ── AI Models ── */}
          <section className="home-section" style={{ marginBottom: 48, animation: "fadeUp 0.4s ease-out 0.1s both" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f11" }}>AI {"\uBAA8\uB378"}</h2>
              <a href="/lm" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                LM {"\uD5C8\uBE0C \u2192"}
              </a>
            </div>
            <div className="model-grid" style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10,
            }}>
              {FEATURED_MODELS.map(model => {
                const pc = PROVIDER_COLORS[model.provider] ?? "#9ca3af";
                return (
                  <div
                    key={model.id}
                    className="model-card"
                    onClick={() => {
                      const modeMap: Record<string, AIMode> = { openai: "openai", anthropic: "anthropic", gemini: "gemini", grok: "grok" };
                      setAiMode(modeMap[model.provider] ?? "openai");
                    }}
                    style={{
                      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                      border: "1.5px solid #e5e7eb", background: "#fff",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: pc, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1b1b1f" }}>{model.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 20,
                        background: `${pc}15`, color: pc, fontWeight: 700, textTransform: "uppercase",
                      }}>
                        {model.provider}
                      </span>
                      <span style={{ fontSize: 10, color: model.speed === "fast" ? "#16a34a" : model.speed === "medium" ? "#f97316" : "#6b7280" }}>
                        {model.speed}
                      </span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{model.cost}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>{model.description}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Published Apps ── */}
          {published.length > 0 && (
            <section className="home-section" style={{ animation: "fadeUp 0.4s ease-out 0.2s both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f0f11" }}>{"\uBC30\uD3EC\uB41C \uC571"}</h2>
                <a href="/gallery" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                  {"\uC804\uCCB4 \uBCF4\uAE30 \u2192"}
                </a>
              </div>
              <div className="pub-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12,
              }}>
                {published.map(app => (
                  <div key={app.slug} className="pub-card" style={{
                    padding: "16px 18px", borderRadius: 14,
                    border: "1.5px solid #e5e7eb", background: "#fff",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{"\uD83C\uDF10"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1b1b1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.name}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>/{app.slug}</div>
                      </div>
                      <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>{"\uD83D\uDC41"} {app.views}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => window.open(`/p/${app.slug}`, "_blank")} style={{
                        flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {"\uC5F4\uAE30"}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${app.slug}`); }} style={{
                        padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                        background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      }}>
                        {"\uB9C1\uD06C"}
                      </button>
                    </div>
                  </div>
                ))}
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
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em" }}>{"3\uB2E8\uACC4\uB85C \uC644\uC131"}</h2>
            </div>
            <div className="home-step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 48 }}>
              {[
                { step: "01", icon: "\uD83D\uDCAC", title: "\uC544\uC774\uB514\uC5B4 \uC785\uB825", desc: "\uD55C\uAD6D\uC5B4\uB85C \uB9CC\uB4E4\uACE0 \uC2F6\uC740 \uAC78 \uC124\uBA85\uD558\uC138\uC694. \uC544\uB798 \uC608\uC2DC\uB97C \uD074\uB9AD\uD574\uB3C4 \uB429\uB2C8\uB2E4." },
                { step: "02", icon: "\uD83E\uDD16", title: "AI\uAC00 \uCF54\uB4DC \uC791\uC131", desc: "\uC120\uD0DD\uD55C AI \uBAA8\uB378\uC774 HTML\xB7CSS\xB7JS\uB97C \uC790\uB3D9 \uC0DD\uC131\uD558\uACE0 \uB514\uBC84\uAE45\uAE4C\uC9C0 \uC644\uB8CC\uD569\uB2C8\uB2E4." },
                { step: "03", icon: "\uD83D\uDE80", title: "\uC989\uC2DC \uBC30\uD3EC\xB7\uACF5\uC720", desc: "\uD55C \uD074\uB9AD\uC73C\uB85C \uACF5\uC720 \uB9C1\uD06C \uC0DD\uC131. \uC5C5\uB370\uC774\uD2B8\uB418\uBA74 \uC790\uB3D9\uC73C\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4." },
              ].map(s => (
                <div key={s.step} style={{ textAlign: "center", padding: "32px 24px", borderRadius: 18, border: "1.5px solid #f0f0f0", background: "#fafafa" }}>
                  <div style={{ fontSize: 38, marginBottom: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#f97316", letterSpacing: "0.08em", marginBottom: 8 }}>STEP {s.step}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#0f0f11", marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", padding: "72px 24px" }}>
            <div style={{ maxWidth: 940, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 44 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{"\uC694\uAE08\uC81C"}</p>
                <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em", marginBottom: 10 }}>{"\uD22C\uBA85\uD55C \uAC00\uACA9"}</h2>
                <p style={{ fontSize: 14, color: "#6b7280" }}>{"14\uC77C \uBB34\uB8CC \uCCB4\uD5D8 \xB7 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C \xB7 \uC2E0\uC6A9\uCE74\uB4DC \uBD88\uD544\uC694"}</p>
              </div>
              <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {PRICING.map(plan => (
                  <div key={plan.name} style={{
                    background: "#fff",
                    border: plan.highlight ? "2px solid #f97316" : "1.5px solid #e5e7eb",
                    borderRadius: 18, padding: "26px 22px", position: "relative",
                    boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.15)" : "none",
                  }}>
                    {plan.highlight && (
                      <div style={{ position: "absolute", top: 12, right: 14, background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{"\uC778\uAE30"}</div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1b1b1f", marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>{plan.desc}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#0f0f11", marginBottom: 3 }}>
                      {plan.price}<span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>/{"월"}</span>
                    </div>
                    {plan.original
                      ? <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through", marginBottom: 18 }}>{plan.original}</div>
                      : <div style={{ marginBottom: 18 }} />
                    }
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
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
                      background: plan.highlight ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)" : "#f3f4f6",
                      color: plan.highlight ? "#fff" : "#374151",
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
            </div>
          </section>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="home-footer" style={{
        borderTop: "1px solid #f0f0f0", background: "#fafafa",
        padding: "40px 24px", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexWrap: "wrap", gap: 24,
      }}>
        <div>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 9, fontWeight: 800,
              fontSize: 17, color: "#1b1b1f", cursor: "pointer", marginBottom: 12,
            }}
            onClick={() => router.push("/")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
            role="button" tabIndex={0} aria-label="Dalkak \uD648\uC73C\uB85C \uC774\uB3D9"
          >
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 13, color: "#fff",
            }}>D</div>
            Dalkak
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 200, lineHeight: 1.7 }}>
            {"AI \uC5D0\uC774\uC804\uD2B8\uB85C \uBE60\uB974\uAC8C \uC571\uC744 \uB9CC\uB4E4\uACE0"}<br />{"\uC2A4\uB9C8\uD2B8\uD558\uAC8C \uBC30\uD3EC\uD558\uC138\uC694."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{"\uC11C\uBE44\uC2A4"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { href: "/workspace", label: "\uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4" },
                { href: "/lm",       label: "LM \uD5C8\uBE0C" },
                { href: "/gallery",   label: "\uAC24\uB7EC\uB9AC" },
                { href: "/pricing",   label: "\uC694\uAE08\uC81C" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>{"\uD68C\uC0AC"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { href: "mailto:support@fieldnine.io", label: "\uACE0\uAC1D \uC9C0\uC6D0" },
                { href: "/privacy", label: "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68" },
                { href: "/terms",   label: "\uC774\uC6A9\uC57D\uAD00" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
