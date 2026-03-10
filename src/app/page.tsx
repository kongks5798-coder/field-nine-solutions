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

// ─── Quick Example Pills ──────────────────────────────────────────────────────

const QUICK_EXAMPLES = [
  { icon: "🎮", text: "스네이크 게임" },
  { icon: "📊", text: "가계부 앱" },
  { icon: "⏱️", text: "포모도로 타이머" },
  { icon: "🛍️", text: "쇼핑몰 랜딩" },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PRICING = [
  {
    name: "무료", price: "₩0", desc: "처음 시작하는 분",
    highlight: false, cta: "무료로 시작", ctaHref: "/signup",
    features: ["앱 생성 50회/월", "프로젝트 3개", "공개 배포 1개"],
  },
  {
    name: "프로", price: "₩39,000", original: "₩49,000",
    desc: "전문가를 위한 무제한 플랜",
    highlight: true, cta: "프로 시작하기", ctaHref: "/pricing",
    features: ["앱 생성 무제한", "프로젝트 무제한", "비공개 배포 무제한", "팀 협업 10명", "클라우드 50GB"],
  },
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
      background: "#faf8f5",
      color: "#0a0a0a",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .nav-wrap { padding: 0 16px !important; }
          .hero-title { font-size: 44px !important; line-height: 1.05 !important; }
          .hero-sub { font-size: 15px !important; }
          .prompt-box { border-radius: 14px !important; }
          .prompt-textarea { padding: 16px 16px 0 !important; font-size: 14px !important; min-height: 72px !important; }
          .example-pills { gap: 6px !important; }
          .example-pill { font-size: 11px !important; padding: 5px 11px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .proj-grid { grid-template-columns: 1fr !important; }
          .section-pad { padding: 56px 16px !important; }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero-title { font-size: 52px !important; }
          .how-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .proj-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .nav-link { text-decoration: none; transition: color 0.12s; }
        .nav-link:hover { color: #0a0a0a !important; }
        .example-pill { transition: border-color 0.15s, color 0.15s, background 0.15s; cursor: pointer; }
        .example-pill:hover { border-color: #0a0a0a !important; color: #0a0a0a !important; }
        .prompt-textarea::placeholder { color: rgba(0,0,0,0.25); }
        .proj-card { transition: border-color 0.15s, transform 0.15s; }
        .proj-card:hover { border-color: rgba(0,0,0,0.25) !important; transform: translateY(-2px); }
        .pricing-cta { transition: opacity 0.12s; }
        .pricing-cta:hover { opacity: 0.85; }
        .make-btn { transition: opacity 0.12s; }
        .make-btn:hover:not(:disabled) { opacity: 0.85; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="nav-wrap" style={{
        display: "flex", alignItems: "center", padding: "0 28px", height: 60,
        background: "rgba(250,248,245,0.92)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/"); } }}
          role="button" tabIndex={0} aria-label="Dalkak 홈으로 이동"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontWeight: 800, fontSize: 16, color: "#0a0a0a",
            cursor: "pointer", flexShrink: 0, marginRight: 28,
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "#0a0a0a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 12, color: "#faf8f5",
          }}>D</div>
          딸깍
        </div>

        {/* Nav links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          {isLoggedIn ? (
            <>
              <a className="nav-link" href="/dashboard" style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 500 }}>대시보드</a>
              <a className="nav-link" href="/showcase" style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 500 }}>쇼케이스</a>
            </>
          ) : (
            <>
              <a className="nav-link" href="/showcase" style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 500 }}>쇼케이스</a>
              <a className="nav-link" href="#pricing" style={{ padding: "5px 12px", borderRadius: 7, fontSize: 14, color: "rgba(0,0,0,0.45)", fontWeight: 500 }}>가격</a>
            </>
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
                background: "#0a0a0a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "#faf8f5", flexShrink: 0,
              }}>
                {displayName!.charAt(0).toUpperCase()}
              </div>
              <span className="hide-mobile" style={{ fontWeight: 600 }}>{displayName}</span>
            </div>
          ) : (
            <>
              <a href="/login" className="hide-mobile" style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                textDecoration: "none", color: "rgba(0,0,0,0.45)",
              }}>
                로그인
              </a>
              <a href="/signup" style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                textDecoration: "none", color: "#faf8f5",
                background: "#0a0a0a",
                whiteSpace: "nowrap",
              }}>
                시작하기
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: isLoggedIn ? 56 : 120,
        paddingBottom: isLoggedIn ? 40 : 120,
        paddingLeft: 24, paddingRight: 24,
        background: "#faf8f5",
      }}>
        {/* Title */}
        <h1 className="hero-title" style={{
          fontSize: isLoggedIn ? 44 : 80,
          fontWeight: 800, color: "#0a0a0a",
          textAlign: "center",
          lineHeight: 1.05, marginBottom: isLoggedIn ? 12 : 24,
          letterSpacing: "-0.04em", maxWidth: 720,
        }}>
          {isLoggedIn ? (
            <>무엇을 만들까요?</>
          ) : (
            <>말하면<br />만들어집니다.</>
          )}
        </h1>

        {/* Subtitle */}
        <p className="hero-sub" style={{
          fontSize: isLoggedIn ? 14 : 18,
          color: "rgba(0,0,0,0.45)",
          textAlign: "center",
          marginBottom: isLoggedIn ? 28 : 48,
          fontWeight: 400, lineHeight: 1.6, maxWidth: 480,
        }}>
          {isLoggedIn
            ? "프롬프트를 입력하면 새 프로젝트가 생성됩니다"
            : "한국어 한 줄로 완성되는 웹앱"}
        </p>

        {/* Hidden AI model selector — functionality preserved */}
        <AIModelSelector value={aiMode} onChange={setAiMode} />

        {/* ── Prompt Box ── */}
        <div className="prompt-box" style={{
          width: "100%", maxWidth: 680,
          background: "#ffffff",
          border: `1px solid ${promptFocused ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 16,
          boxShadow: promptFocused
            ? "0 2px 24px rgba(0,0,0,0.12)"
            : "0 2px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}>
          <textarea
            className="prompt-textarea"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onFocus={() => setPromptFocused(true)}
            onBlur={() => setPromptFocused(false)}
            onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
            placeholder="어떤 앱을 만들까요?"
            style={{
              width: "100%", padding: "20px 20px 0",
              fontSize: 16, color: "#0a0a0a",
              border: "none", outline: "none", resize: "none",
              minHeight: 88, background: "transparent",
              fontFamily: "inherit", lineHeight: 1.6,
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
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 20px", borderRadius: 10, border: "none", flexShrink: 0,
                background: !prompt.trim() ? "rgba(0,0,0,0.06)" : "#0a0a0a",
                color: !prompt.trim() ? "rgba(0,0,0,0.25)" : "#ffffff",
                fontSize: 14, fontWeight: 700,
                cursor: !prompt.trim() ? "not-allowed" : "pointer",
                transition: "opacity 0.12s, background 0.15s, color 0.15s",
              }}
            >
              만들기 →
            </button>
          </div>
        </div>

        {/* Example Pills */}
        <div className="example-pills" style={{
          display: "flex", gap: 8, marginTop: 24,
          justifyContent: "center", flexWrap: "wrap",
        }}>
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex.text}
              className="example-pill"
              onClick={() => handleStart(ex.text)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "transparent",
                color: "rgba(0,0,0,0.6)", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 13 }}>{ex.icon}</span>
              <span>{ex.text}</span>
            </button>
          ))}
        </div>

        {/* Social Proof — 비로그인 전용 */}
        {!isLoggedIn && featuredApps.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 40,
            justifyContent: "center",
          }}>
            <div style={{ display: "flex", gap: -4 }}>
              {featuredApps.slice(0, 4).map((app, i) => {
                const COLORS = ["#374151", "#6b7280", "#9ca3af", "#d1d5db"];
                return (
                  <div
                    key={app.slug}
                    title={app.name}
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: COLORS[i % COLORS.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: "#fff",
                      border: "2px solid #faf8f5",
                      marginLeft: i > 0 ? -6 : 0,
                      position: "relative", zIndex: 4 - i,
                    }}
                  >
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
            </div>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.35)", fontWeight: 400 }}>
              지금도 누군가 앱을 만들고 있어요
            </span>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LOGGED-IN HUB
         ══════════════════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 80px" }}>
          {/* 오늘의 딸깍 */}
          {featuredApps.length > 0 && (
            <section style={{ marginTop: 32, animation: "fadeUp 0.35s ease-out 0.1s both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>오늘의 딸깍</h2>
                <a href="/showcase" style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 600, textDecoration: "none" }}>전체 보기 →</a>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {featuredApps.map((app) => (
                  <div key={app.slug} className="proj-card" style={{
                    minWidth: 160, flexShrink: 0, borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#ffffff",
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{app.badge}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>{app.name}</div>
                      <button
                        onClick={() => window.open(`/p/${app.slug}`, "_blank")}
                        style={{
                          width: "100%", padding: "6px 0", borderRadius: 7, border: "none",
                          background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        열기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LOGGED-OUT: Marketing
         ══════════════════════════════════════════════════════════════════════ */}
      {!isLoggedIn && (
        <>
          {/* ── HOW IT WORKS ── */}
          <section className="section-pad" id="how" style={{ background: "#f0ede8", padding: "96px 24px" }}>
            <div style={{ maxWidth: 880, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 72 }}>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em" }}>3단계로 완성</h2>
              </div>
              <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                {[
                  { step: "01", title: "입력", desc: "원하는 앱을 한국어로 설명하세요" },
                  { step: "02", title: "생성", desc: "60초 안에 완성된 앱이 만들어집니다" },
                  { step: "03", title: "완성", desc: "링크 하나로 바로 공유하세요" },
                ].map(s => (
                  <div key={s.step} style={{ textAlign: "center", padding: "40px 24px" }}>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(0,0,0,0.15)", marginBottom: 16, lineHeight: 1 }}>{s.step}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0a0a0a", marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: "rgba(0,0,0,0.5)", fontWeight: 400, lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section className="section-pad" id="pricing" style={{ background: "#faf8f5", padding: "96px 24px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em", marginBottom: 12 }}>투명한 가격</h2>
                <p style={{ fontSize: 14, color: "rgba(0,0,0,0.4)", fontWeight: 400 }}>14일 무료 체험 · 언제든 취소 · 신용카드 불필요</p>
              </div>
              <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 620, margin: "0 auto" }}>
                {PRICING.map(plan => (
                  <div key={plan.name} style={{
                    background: "#ffffff",
                    border: plan.highlight ? "1.5px solid #0a0a0a" : "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 16, padding: "28px 22px", position: "relative",
                  }}>
                    {plan.highlight && (
                      <div style={{
                        position: "absolute", top: -1, right: 20,
                        background: "#0a0a0a", color: "#faf8f5",
                        fontSize: 10, fontWeight: 700, padding: "3px 10px",
                        borderRadius: "0 0 8px 8px", letterSpacing: "0.04em",
                      }}>인기</div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", marginBottom: 16, fontWeight: 400 }}>{plan.desc}</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#0a0a0a", marginBottom: 2 }}>
                      {plan.price}
                      <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(0,0,0,0.35)" }}>/월</span>
                    </div>
                    {plan.original ? (
                      <div style={{ fontSize: 11, color: "rgba(0,0,0,0.25)", textDecoration: "line-through", marginBottom: 20 }}>{plan.original}</div>
                    ) : (
                      <div style={{ marginBottom: 20 }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                      {plan.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "rgba(0,0,0,0.6)", fontWeight: 400 }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                            <path d="M2.5 7l3 3 6-6" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {f}
                        </div>
                      ))}
                    </div>
                    <a
                      href={plan.ctaHref}
                      className="pricing-cta"
                      style={{
                        display: "block", padding: "11px 0", borderRadius: 10,
                        textAlign: "center", textDecoration: "none", fontSize: 13, fontWeight: 700,
                        background: plan.highlight ? "#0a0a0a" : "rgba(0,0,0,0.05)",
                        color: plan.highlight ? "#ffffff" : "rgba(0,0,0,0.55)",
                      }}
                    >
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section style={{ padding: "96px 24px", textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#faf8f5" }}>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0a0a0a", marginBottom: 16, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                지금 바로<br />시작하세요
              </h2>
              <p style={{ fontSize: 15, color: "rgba(0,0,0,0.4)", marginBottom: 36, lineHeight: 1.7, fontWeight: 400 }}>
                무료로 시작하고 5분 안에 첫 앱을 만들어보세요.
              </p>
              <a href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 12,
                background: "#0a0a0a", color: "#faf8f5",
                textDecoration: "none", fontSize: 15, fontWeight: 700,
              }}>
                무료로 시작하기 →
              </a>
              <p style={{ marginTop: 16, fontSize: 12, color: "rgba(0,0,0,0.3)" }}>
                Google 또는 Kakao 계정으로 즉시 시작
              </p>
            </div>
          </section>
        </>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "#0a0a0a",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
          © 2026 FieldNine
          {" · "}
          <a href="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>개인정보</a>
          {" · "}
          <a href="/terms" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>이용약관</a>
        </p>
      </footer>

      {/* PWA install (hidden, kept for functionality) */}
      {showDownload && (
        <>
          <div onClick={() => setShowDownload(false)} onKeyDown={(e) => { if (e.key === "Escape") setShowDownload(false); }} role="presentation" style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,0.3)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#ffffff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 16,
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 280, maxWidth: 320, overflow: "hidden",
          }}>
            <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", marginBottom: 3 }}>앱 설치</div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>홈 화면에 추가해 앱처럼 사용하세요</div>
            </div>
            {canInstall ? (
              <button onClick={handleInstall} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 18px", border: "none", background: "rgba(0,0,0,0.04)", cursor: "pointer",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#faf8f5", flexShrink: 0 }}>D</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>이 기기에 설치</div>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.4)" }}>클릭 한 번으로 홈 화면에 추가</div>
                </div>
              </button>
            ) : (
              <div style={{ padding: "12px 18px", fontSize: 12, color: "rgba(0,0,0,0.5)", lineHeight: 2 }}>
                📱 <b>iPhone/iPad</b> → Safari → 공유 → 홈 화면에 추가<br/>
                🤖 <b>Android</b> → Chrome → 메뉴 → 앱 설치<br/>
                💻 <b>PC</b> → Chrome 주소창 우측 <b>⊕</b> 버튼
              </div>
            )}
            <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button onClick={() => setShowDownload(false)} style={{
                width: "100%", padding: "9px", borderRadius: 8, border: "none",
                background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
