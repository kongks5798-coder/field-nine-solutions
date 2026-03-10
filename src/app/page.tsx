"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIMode } from "@/lib/ai/multiAI";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { genId, saveProjectToStorage } from "@/app/workspace/stores/useProjectStore";
import {
  DEFAULT_FILES, CUR_KEY,
} from "@/app/workspace/workspace.constants";
import type { Project } from "@/app/workspace/workspace.constants";

// BeforeInstallPromptEvent kept for type safety on the handler
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ─── AI Model Selector (functionality kept, UI hidden) ────────────────────────

const AI_SELECTOR_MODELS: { value: AIMode; label: string }[] = [
  { value: "openai",    label: "빠름" },
  { value: "anthropic", label: "표준" },
  { value: "gemini",    label: "플래시" },
  { value: "grok",      label: "실험" },
];

function AIModelSelector({ value, onChange }: { value: AIMode; onChange: (v: AIMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hidden from UI — functionality preserved internally
  return (
    <div ref={ref} style={{ display: "none" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ display: "none" }}
      >
        {value}
      </button>
      {open && (
        <div>
          {AI_SELECTOR_MODELS.map(m => (
            <button
              key={m.value}
              onClick={() => { onChange(m.value); setOpen(false); }}
              style={{ display: "none" }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Template Tiles ───────────────────────────────────────────────────────────

const TEMPLATE_TILES = [
  { icon: "🎮", text: "게임",      prompt: "슈팅 게임 만들어줘",          gradient: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
  { icon: "📊", text: "대시보드",  prompt: "판매 대시보드 만들어줘",       gradient: "linear-gradient(135deg,#059669,#0891b2)" },
  { icon: "⏱️", text: "타이머",    prompt: "뽀모도로 타이머 만들어줘",     gradient: "linear-gradient(135deg,#f97316,#dc2626)" },
  { icon: "🛍️", text: "쇼핑몰",   prompt: "패션 쇼핑몰 만들어줘",         gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
  { icon: "📝", text: "폼",        prompt: "설문 폼 만들어줘",             gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  { icon: "🎨", text: "포트폴리오", prompt: "디자이너 포트폴리오 만들어줘", gradient: "linear-gradient(135deg,#d946ef,#ec4899)" },
  { icon: "📅", text: "캘린더",    prompt: "일정 관리 캘린더 만들어줘",    gradient: "linear-gradient(135deg,#14b8a6,#0891b2)" },
  { icon: "🧮", text: "계산기",    prompt: "과학 계산기 만들어줘",          gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("anthropic");
  const [promptFocused, setPromptFocused] = useState(false);
  const [featuredApps, setFeaturedApps] = useState<Array<{ slug: string; name: string; views: number; likes: number; score: number | null; badge: string }>>([]);
  const [showDownload, setShowDownload] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    fetch("/api/showcase/featured")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.featured)) setFeaturedApps(d.featured); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
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

  const getUserDisplay = (u: User) =>
    u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "사용자";

  const handleStart = (q?: string) => {
    const text = (q ?? prompt).trim();
    if (!text) return;
    const newId = genId();
    const newProj: Project = {
      id: newId,
      name: (() => {
        const n = text.replace(/만들어줘|만들어|해줘|해주세요|주세요|please|create|make|build|generate/gi, "")
          .replace(/[,;!?]/g, "").trim().split(/\s+/).slice(0, 4).join(" ").slice(0, 30);
        return n.length >= 2 ? n : text.slice(0, 30);
      })(),
      files: { ...DEFAULT_FILES },
      updatedAt: new Date().toISOString(),
    };
    saveProjectToStorage(newProj);
    localStorage.setItem(CUR_KEY, newId);
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId, name: newProj.name, files: newProj.files, updatedAt: newProj.updatedAt }),
    }).catch(() => {});
    const url = `/workspace?q=${encodeURIComponent(text)}&mode=${aiMode}`;
    router.push(user ? url : `/login?next=${encodeURIComponent(url)}`);
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
      minHeight: "100vh",
      background: isLoggedIn ? "#faf8f5" : "#0a0a0f",
      color: isLoggedIn ? "#0a0a0a" : "#f0f4f8",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* Skip link */}
      <a href="#main-content" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>본문 바로가기</a>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-8px); } }
        .tile-card { transition: transform 0.18s ease, filter 0.18s ease; }
        .tile-card:hover { transform: scale(1.04); filter: brightness(1.1); }
        .make-btn { transition: opacity 0.12s, transform 0.12s; }
        .make-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .cta-btn { transition: opacity 0.12s, transform 0.12s; }
        .cta-btn:hover { opacity:0.88 !important; transform:translateY(-1px); }
        .proj-card { transition: border-color 0.15s, transform 0.15s; }
        .proj-card:hover { border-color: rgba(249,115,22,0.35) !important; transform: translateY(-2px); }
        .nav-link { text-decoration: none; transition: color 0.12s; }
        .nav-link-dark:hover { color: #f0f4f8 !important; }
        .nav-link-light:hover { color: #0a0a0a !important; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .nav-wrap { padding: 0 16px !important; }
          .hero-title { font-size: 44px !important; line-height: 1.05 !important; font-weight: 300 !important; }
          .hero-sub { font-size: 16px !important; }
          .prompt-box { border-radius: 16px !important; }
          .prompt-textarea { padding: 16px 16px 0 !important; font-size: 14px !important; min-height: 72px !important; }
          .tile-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .section-pad { padding: 72px 16px !important; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero-title { font-size: 52px !important; }
          .how-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .tile-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .prompt-textarea-dark::placeholder { color: rgba(255,255,255,0.3) !important; }
        .prompt-textarea-light::placeholder { color: rgba(0,0,0,0.25) !important; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="nav-wrap" style={{
        display: "flex", alignItems: "center", padding: "0 28px", height: 60,
        background: isLoggedIn ? "rgba(250,248,245,0.92)" : "rgba(10,10,15,0.72)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: isLoggedIn ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
          role="button" tabIndex={0} aria-label="Dalkak 홈으로 이동"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontWeight: 700, fontSize: 16,
            color: isLoggedIn ? "#0a0a0a" : "#f0f4f8",
            cursor: "pointer", flexShrink: 0, marginRight: 28,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 12, color: "#ffffff",
          }}>D</div>
          딸깍
        </div>

        {/* Nav links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {isLoggedIn ? (
            <>
              <a
                className={`nav-link nav-link-light`}
                href="/dashboard"
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}
              >대시보드</a>
              <a
                className={`nav-link nav-link-light`}
                href="/showcase"
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}
              >쇼케이스</a>
            </>
          ) : (
            <a
              className={`nav-link nav-link-dark`}
              href="/showcase"
              style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 400 }}
            >쇼케이스</a>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {isLoggedIn ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 12px", borderRadius: 8,
              background: "rgba(0,0,0,0.04)",
              fontSize: 13, color: "#0a0a0a",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "#ffffff", flexShrink: 0,
              }}>
                {displayName!.charAt(0).toUpperCase()}
              </div>
              <span className="hide-mobile" style={{ fontWeight: 500 }}>{displayName}</span>
            </div>
          ) : (
            <>
              <a href="/login" className="hide-mobile" style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 400,
                textDecoration: "none", color: "rgba(255,255,255,0.55)",
              }}>
                로그인
              </a>
              <a href="/signup" style={{
                padding: "7px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                textDecoration: "none", color: "#ffffff",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                whiteSpace: "nowrap",
              }}>
                시작하기
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          LOGGED-OUT EXPERIENCE
         ══════════════════════════════════════════════════════════════════════ */}
      {!isLoggedIn && (
        <>
          {/* ── HERO ── */}
          <section id="main-content" style={{
            position: "relative",
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 140, paddingBottom: 140,
            paddingLeft: 24, paddingRight: 24,
            background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0d0d1a 100%)",
            overflow: "hidden",
          }}>
            {/* Orange radial glow */}
            <div style={{
              position: "absolute", top: "30%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 800, height: 800,
              background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 65%)",
              pointerEvents: "none",
            }} />

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 100,
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
              fontSize: 12, fontWeight: 500, color: "#fb923c",
              marginBottom: 36, position: "relative",
              animation: "fadeUp 0.5s ease-out both",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
              AI 앱 빌더 — 한국어로 만드세요
            </div>

            {/* Title */}
            <h1 className="hero-title" style={{
              fontSize: 80,
              fontWeight: 300,
              textAlign: "center",
              lineHeight: 1.05,
              marginBottom: 28,
              letterSpacing: "-0.04em",
              maxWidth: 780,
              position: "relative",
              animation: "fadeUp 0.55s ease-out 0.08s both",
            }}>
              <span style={{ color: "#f0f4f8" }}>말하면</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                만들어집니다.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-sub" style={{
              fontSize: 18, color: "rgba(240,244,248,0.55)",
              textAlign: "center",
              marginBottom: 52,
              fontWeight: 400, lineHeight: 1.6, maxWidth: 420,
              position: "relative",
              animation: "fadeUp 0.55s ease-out 0.14s both",
            }}>
              한국어 한 줄로 완성되는 웹앱 — 60초 안에
            </p>

            {/* Hidden AI model selector — functionality preserved */}
            <AIModelSelector value={aiMode} onChange={setAiMode} />

            {/* ── Prompt Box ── */}
            <div className="prompt-box" style={{
              width: "100%", maxWidth: 680,
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${promptFocused ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 20,
              boxShadow: promptFocused
                ? "0 0 0 1px rgba(249,115,22,0.2), 0 24px 80px rgba(0,0,0,0.5)"
                : "0 0 0 1px rgba(249,115,22,0.1), 0 24px 80px rgba(0,0,0,0.4)",
              overflow: "hidden",
              transition: "border-color 0.15s, box-shadow 0.15s",
              position: "relative",
              animation: "fadeUp 0.55s ease-out 0.2s both",
            }}>
              <textarea
                className="prompt-textarea prompt-textarea-dark"
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
                placeholder="어떤 앱을 만들까요? (예: 뽀모도로 타이머 만들어줘)"
                aria-label="앱 설명 입력"
                aria-multiline="true"
                style={{
                  width: "100%", padding: "22px 22px 0",
                  fontSize: 16, color: "#f0f4f8",
                  border: "none", outline: "none", resize: "none",
                  minHeight: 92, background: "transparent",
                  fontFamily: "inherit", lineHeight: 1.6, fontWeight: 400,
                }}
              />
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", gap: 8,
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>
                  ⌘↵ 로 바로 만들기
                </span>
                <button
                  className="make-btn"
                  onClick={() => handleStart()}
                  disabled={!prompt.trim()}
                  aria-label="앱 만들기 — 워크스페이스로 이동"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 22px", borderRadius: 10, border: "none", flexShrink: 0,
                    background: !prompt.trim()
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, #f97316, #ea580c)",
                    color: !prompt.trim() ? "rgba(255,255,255,0.2)" : "#ffffff",
                    fontSize: 14, fontWeight: 600,
                    cursor: !prompt.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: prompt.trim() ? "0 4px 16px rgba(249,115,22,0.35)" : "none",
                  }}
                >
                  만들기 →
                </button>
              </div>
            </div>

            {/* Template Tiles */}
            <div
              className="tile-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 140px)",
                gap: 12,
                marginTop: 32,
                justifyContent: "center",
                position: "relative",
                animation: "fadeUp 0.55s ease-out 0.28s both",
              }}
            >
              {TEMPLATE_TILES.map((tile) => (
                <button
                  key={tile.text}
                  className="tile-card"
                  onClick={() => handleStart(tile.prompt)}
                  aria-label={`${tile.text} 앱 만들기`}
                  style={{
                    width: 140, height: 90,
                    borderRadius: 14,
                    background: tile.gradient,
                    border: "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    padding: 16,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 8,
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{tile.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{tile.text}</span>
                </button>
              ))}
            </div>

            {/* Social Proof */}
            {featuredApps.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                marginTop: 40,
                padding: "12px 20px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                position: "relative",
                animation: "fadeUp 0.55s ease-out 0.35s both",
              }}>
                <div style={{ display: "flex" }}>
                  {featuredApps.slice(0, 5).map((app, i) => {
                    const AVATAR_COLORS = ["#7c3aed", "#059669", "#f97316", "#ec4899", "#0ea5e9"];
                    return (
                      <div
                        key={app.slug}
                        title={app.name}
                        style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff",
                          border: "2px solid #0a0a0f",
                          marginLeft: i > 0 ? -8 : 0,
                          position: "relative", zIndex: 5 - i,
                        }}
                      >
                        {app.name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}
                </div>
                <span style={{ fontSize: 13, color: "rgba(240,244,248,0.55)", fontWeight: 400 }}>
                  🚀 오늘 만들어진 앱 &nbsp;·&nbsp; 지금 누군가 만들고 있어요
                </span>
              </div>
            )}
          </section>

          {/* ── FEATURED APPS ── */}
          {featuredApps.length > 0 && (
            <section style={{
              background: "#f5f3f0",
              padding: "80px 24px",
              borderTop: "1px solid rgba(0,0,0,0.06)",
            }}>
              <div style={{ maxWidth: 960, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0a0a0a" }}>오늘의 딸깍</h2>
                    <div style={{
                      padding: "3px 10px", borderRadius: 100,
                      background: "linear-gradient(135deg, #f97316, #ea580c)",
                      fontSize: 11, fontWeight: 700, color: "#ffffff",
                    }}>NEW</div>
                  </div>
                  <a href="/showcase" style={{
                    fontSize: 13, color: "#6b7280", fontWeight: 500,
                    textDecoration: "none",
                    padding: "6px 14px", borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#ffffff",
                  }}>전체 보기 →</a>
                </div>
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
                  {featuredApps.map((app, idx) => {
                    const cardGradients = TEMPLATE_TILES.map(t => t.gradient);
                    return (
                      <div key={app.slug} className="proj-card" style={{
                        minWidth: 200, flexShrink: 0, borderRadius: 16,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "#ffffff",
                        overflow: "hidden",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                      }}>
                        {/* Gradient header */}
                        <div style={{
                          height: 120,
                          background: cardGradients[idx % cardGradients.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 40 }}>{TEMPLATE_TILES[idx % TEMPLATE_TILES.length].icon}</span>
                        </div>
                        <div style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(0,0,0,0.3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{app.badge}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 12 }}>{app.name}</div>
                          <button
                            onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                            aria-label={`${app.name} 앱 열기`}
                            style={{
                              width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
                              background: "rgba(0,0,0,0.05)", color: "#374151",
                              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                              minHeight: 36,
                            }}
                          >
                            열기
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── HOW IT WORKS ── */}
          <section className="section-pad" id="how" style={{
            background: "#ffffff",
            padding: "100px 24px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 64 }}>
                <div style={{
                  display: "inline-block",
                  padding: "4px 14px", borderRadius: 100,
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.2)",
                  fontSize: 12, fontWeight: 600, color: "#f97316",
                  marginBottom: 16, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>어떻게 동작하나요</div>
                <h2 style={{ fontSize: 40, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
                  3단계로 완성
                </h2>
              </div>
              <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {[
                  { step: "01", icon: "✍️", title: "입력", desc: "원하는 앱을 한국어로 자유롭게 설명하세요. 길게 써도, 짧게 써도 괜찮아요.", color: "#f97316" },
                  { step: "02", icon: "⚡", title: "AI 생성", desc: "4개의 AI 에이전트가 병렬로 동작해 60초 안에 완성된 앱을 만들어냅니다.", color: "#7c3aed" },
                  { step: "03", icon: "🚀", title: "공유", desc: "링크 하나로 누구에게나 바로 공유하세요. 설치 없이 바로 실행됩니다.", color: "#059669" },
                ].map(s => (
                  <div key={s.step} style={{
                    background: "#f8fafc",
                    borderRadius: 20,
                    padding: "40px 32px",
                    textAlign: "left",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, color: "#ffffff",
                        flexShrink: 0,
                      }}>{s.step}</div>
                    </div>
                    <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0a0a0a", marginBottom: 10 }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 400, lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section style={{
            padding: "120px 24px",
            textAlign: "center",
            background: "#0a0a0f",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600, height: 600,
              background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
              <h2 style={{
                fontSize: 64, fontWeight: 300, color: "#f0f4f8",
                marginBottom: 20, letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>
                지금 무료로<br />시작하세요
              </h2>
              <p style={{ fontSize: 18, color: "rgba(240,244,248,0.45)", marginBottom: 48, lineHeight: 1.7, fontWeight: 400 }}>
                5분 안에 첫 앱을 만들어보세요. 신용카드 불필요.
              </p>
              <a
                href="/signup"
                className="cta-btn"
                aria-label="무료로 시작하기 — 회원가입 페이지로 이동"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "16px 40px", borderRadius: 12,
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "#ffffff",
                  textDecoration: "none", fontSize: 16, fontWeight: 700,
                  boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
                }}
              >
                무료로 시작하기 →
              </a>
              <p style={{ marginTop: 20, fontSize: 13, color: "rgba(240,244,248,0.3)", fontWeight: 400 }}>
                Google 또는 Kakao 계정으로 즉시 시작
              </p>
            </div>
          </section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LOGGED-IN HUB
         ══════════════════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <>
          {/* Hero */}
          <section id="main-content" style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 64, paddingBottom: 48,
            paddingLeft: 24, paddingRight: 24,
            background: "#faf8f5",
          }}>
            <h1 className="hero-title" style={{
              fontSize: 44,
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.05, marginBottom: 12,
              letterSpacing: "-0.04em", maxWidth: 640,
              color: "#0a0a0a",
            }}>
              무엇을 <span style={{ color: "#f97316" }}>만들까요?</span>
            </h1>

            <p className="hero-sub" style={{
              fontSize: 15, color: "#6b7280",
              textAlign: "center",
              marginBottom: 32,
              fontWeight: 400, lineHeight: 1.6, maxWidth: 400,
            }}>
              프롬프트를 입력하면 새 프로젝트가 생성됩니다
            </p>

            {/* Hidden AI model selector — functionality preserved */}
            <AIModelSelector value={aiMode} onChange={setAiMode} />

            {/* Prompt Box — logged-in version */}
            <div className="prompt-box" style={{
              width: "100%", maxWidth: 680,
              background: "#ffffff",
              border: `1px solid ${promptFocused ? "rgba(249,115,22,0.4)" : "rgba(0,0,0,0.1)"}`,
              borderRadius: 20,
              boxShadow: promptFocused
                ? "0 0 0 3px rgba(249,115,22,0.08), 0 4px 24px rgba(0,0,0,0.1)"
                : "0 2px 16px rgba(0,0,0,0.06)",
              overflow: "hidden",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}>
              <textarea
                className="prompt-textarea prompt-textarea-light"
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)}
                onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
                placeholder="어떤 앱을 만들까요?"
                aria-label="앱 설명 입력"
                aria-multiline="true"
                style={{
                  width: "100%", padding: "20px 20px 0",
                  fontSize: 16, color: "#0a0a0a",
                  border: "none", outline: "none", resize: "none",
                  minHeight: 88, background: "transparent",
                  fontFamily: "inherit", lineHeight: 1.6, fontWeight: 400,
                }}
              />
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                padding: "12px 14px", gap: 8,
              }}>
                <button
                  className="make-btn"
                  onClick={() => handleStart()}
                  disabled={!prompt.trim()}
                  aria-label="앱 만들기 — 워크스페이스로 이동"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 22px", borderRadius: 10, border: "none", flexShrink: 0,
                    background: !prompt.trim()
                      ? "rgba(0,0,0,0.06)"
                      : "linear-gradient(135deg, #f97316, #ea580c)",
                    color: !prompt.trim() ? "rgba(0,0,0,0.25)" : "#ffffff",
                    fontSize: 14, fontWeight: 600,
                    cursor: !prompt.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: prompt.trim() ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
                  }}
                >
                  만들기 →
                </button>
              </div>
            </div>

            {/* Template Tiles — logged-in (ivory variant) */}
            <div
              className="tile-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 140px)",
                gap: 12,
                marginTop: 28,
                justifyContent: "center",
              }}
            >
              {TEMPLATE_TILES.map((tile) => (
                <button
                  key={tile.text}
                  className="tile-card"
                  onClick={() => handleStart(tile.prompt)}
                  aria-label={`${tile.text} 앱 만들기`}
                  style={{
                    width: 140, height: 90,
                    borderRadius: 14,
                    background: tile.gradient,
                    border: "1px solid rgba(255,255,255,0.15)",
                    cursor: "pointer",
                    padding: 16,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 8,
                    fontFamily: "inherit",
                    opacity: 0.88,
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{tile.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{tile.text}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Featured Apps — logged-in */}
          {featuredApps.length > 0 && (
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
              <section style={{ marginTop: 8, animation: "fadeUp 0.35s ease-out 0.1s both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>오늘의 딸깍</h2>
                  <a href="/showcase" style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, textDecoration: "none" }}>전체 보기 →</a>
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {featuredApps.map((app, idx) => {
                    const cardGradients = TEMPLATE_TILES.map(t => t.gradient);
                    return (
                      <div key={app.slug} className="proj-card" style={{
                        minWidth: 160, flexShrink: 0, borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "#ffffff",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: 64,
                          background: cardGradients[idx % cardGradients.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 28 }}>{TEMPLATE_TILES[idx % TEMPLATE_TILES.length].icon}</span>
                        </div>
                        <div style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(0,0,0,0.3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{app.badge}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>{app.name}</div>
                          <button
                            onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                            aria-label={`${app.name} 앱 열기`}
                            style={{
                              width: "100%", padding: "6px 0", borderRadius: 7, border: "none",
                              background: "rgba(0,0,0,0.05)", color: "#6b7280",
                              fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                              minHeight: 36,
                            }}
                          >
                            열기
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        background: "#0a0a0f",
        padding: "36px 24px",
        textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 4,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, color: "#ffffff",
          }}>D</div>
          <span style={{ fontSize: 13, color: "rgba(240,244,248,0.25)", fontWeight: 400 }}>
            © 2026 FieldNine
          </span>
          <span style={{ color: "#f97316", fontSize: 10 }}>•</span>
          <a href="https://fieldnine.io" style={{ fontSize: 13, color: "rgba(240,244,248,0.25)", fontWeight: 400, textDecoration: "none" }}>
            fieldnine.io
          </a>
        </div>
      </footer>

      {/* PWA install (kept for functionality) */}
      {showDownload && (
        <>
          <div
            onClick={() => setShowDownload(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setShowDownload(false); }}
            role="presentation"
            style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,0.5)" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)", zIndex: 50, minWidth: 300, maxWidth: 340, overflow: "hidden",
          }}>
            <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f4f8", marginBottom: 4 }}>앱 설치</div>
              <div style={{ fontSize: 13, color: "rgba(240,244,248,0.45)" }}>홈 화면에 추가해 앱처럼 사용하세요</div>
            </div>
            {canInstall ? (
              <button onClick={handleInstall} style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "16px 22px", border: "none", background: "rgba(255,255,255,0.04)", cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "#ffffff", flexShrink: 0,
                }}>D</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f4f8" }}>이 기기에 설치</div>
                  <div style={{ fontSize: 12, color: "rgba(240,244,248,0.45)" }}>클릭 한 번으로 홈 화면에 추가</div>
                </div>
              </button>
            ) : (
              <div style={{ padding: "16px 22px", fontSize: 12, color: "rgba(240,244,248,0.55)", lineHeight: 2.2 }}>
                📱 <b style={{ color: "#f0f4f8" }}>iPhone/iPad</b> → Safari → 공유 → 홈 화면에 추가<br/>
                🤖 <b style={{ color: "#f0f4f8" }}>Android</b> → Chrome → 메뉴 → 앱 설치<br/>
                💻 <b style={{ color: "#f0f4f8" }}>PC</b> → Chrome 주소창 우측 <b style={{ color: "#f0f4f8" }}>⊕</b> 버튼
              </div>
            )}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => setShowDownload(false)} style={{
                width: "100%", padding: "10px", borderRadius: 10, border: "none",
                background: "rgba(255,255,255,0.06)", color: "rgba(240,244,248,0.55)",
                fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
