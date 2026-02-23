"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AIMode } from "@/lib/ai/multiAI";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── AI Model Selector ────────────────────────────────────────────────────────

const AI_MODELS: { value: AIMode; label: string; color: string }[] = [
  { value: "openai",    label: "GPT-4o mini",       color: "#10b981" },
  { value: "anthropic", label: "Claude 3.5 Sonnet", color: "#7c3aed" },
  { value: "gemini",    label: "Gemini 1.5 Flash",  color: "#3b82f6" },
  { value: "grok",      label: "Grok 3",            color: "#111827" },
];

function AIModelSelector({ value, onChange }: { value: AIMode; onChange: (v: AIMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = AI_MODELS.find(m => m.value === value) ?? AI_MODELS[0];
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
          {AI_MODELS.map(m => (
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

// ─── Example Prompts ──────────────────────────────────────────────────────────

const EXAMPLES = [
  { icon: "🎮", text: "테트리스 게임 만들어줘" },
  { icon: "📹", text: "유튜브 숏츠 자동생성기 만들어줘" },
  { icon: "🛒", text: "쇼핑몰 결제 앱 만들어줘" },
  { icon: "📊", text: "실시간 대시보드 만들어줘" },
  { icon: "💬", text: "AI 챗봇 만들어줘" },
  { icon: "📅", text: "온라인 예약 관리 시스템 만들어줘" },
  { icon: "💰", text: "가계부 & 지출 분석기 만들어줘" },
  { icon: "🎵", text: "음악 플레이어 만들어줘" },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PRICING = [
  {
    name: "무료", price: "₩0", desc: "처음 시작하는 분",
    highlight: false, cta: "무료로 시작", ctaHref: "/signup",
    features: ["AI 생성 50회/월", "프로젝트 3개", "GPT-4o mini", "공개 배포 1개"],
  },
  {
    name: "프로", price: "₩39,000", original: "₩49,000",
    desc: "전문가를 위한 무제한 플랜",
    highlight: true, cta: "프로 시작하기", ctaHref: "/pricing",
    features: ["AI 생성 무제한", "프로젝트 무제한", "GPT·Claude·Gemini·Grok", "비공개 배포 무제한", "팀 협업 10명", "클라우드 50GB"],
  },
  {
    name: "팀", price: "₩99,000", original: "₩129,000",
    desc: "대규모 팀을 위한 플랜",
    highlight: false, cta: "팀 시작하기", ctaHref: "/pricing",
    features: ["프로 모든 기능", "팀원 무제한", "클라우드 200GB", "SSO/SAML 2.0", "전담 매니저", "SLA 99.9%"],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("openai");
  const [activeAutonomy, setActiveAutonomy] = useState("high");
  const [showDownload, setShowDownload] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));

    // PWA 설치 이벤트 감지 (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    const url = `/workspace?q=${encodeURIComponent(text)}&mode=${aiMode}&autonomy=${activeAutonomy}`;
    router.push(user ? url : `/login?next=${encodeURIComponent(url)}`);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    setShowDownload(false);
  };

  const displayName = user ? getUserDisplay(user) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#fff", color: "#1b1b1f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .home-nav { padding: 0 16px !important; }
          .home-hero { padding-top: 48px !important; padding-bottom: 48px !important; min-height: calc(100svh - 58px) !important; justify-content: center !important; }
          .home-hero-badge { font-size: 11px !important; }
          .home-hero-sub { font-size: 14px !important; margin-bottom: 24px !important; }
          .home-prompt-textarea { font-size: 14px !important; min-height: 76px !important; padding: 14px 16px 0 !important; }
          .home-example-chips { gap: 6px !important; margin-top: 14px !important; }
          .home-chip { font-size: 11px !important; padding: 5px 11px !important; }
          .home-how-section { padding: 48px 20px !important; }
          .home-footer { flex-direction: column !important; gap: 20px !important; }
        }
        @media (max-width: 768px) {
          .home-nav-links { display: none !important; }
          .home-hero-title { font-size: 38px !important; }
          .home-step-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .home-hero-title { font-size: 30px !important; letter-spacing: -0.02em !important; }
        }
        .home-navlink { text-decoration: none; }
        .home-navlink:hover { background: #f3f4f6; color: #111; }
        .home-chip:hover { border-color: #f97316; color: #ea580c; background: #fff7ed; }
        .home-prompt-textarea::placeholder { color: #b0b8c4; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
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
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push("/"); } }}
          role="button"
          tabIndex={0}
          aria-label="Dalkak 홈으로 이동"
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
        <div className="home-nav-links" style={{
          display: "flex", alignItems: "center", gap: 2, flex: 1,
        }}>
          <a className="home-navlink" href="#how" style={{
            padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563",
            textDecoration: "none", fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
          }}>작동 방식</a>
          <a className="home-navlink" href="#pricing" style={{
            padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563",
            textDecoration: "none", fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
          }}>요금제</a>
          <a className="home-navlink" href="/gallery" style={{
            padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563",
            textDecoration: "none", fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
          }}>갤러리</a>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginLeft: "auto",
        }}>
          {/* 앱 설치 / 다운로드 드롭다운 */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDownload(v => !v)}
              aria-label="앱 만들기"
              aria-haspopup="menu"
              aria-expanded={showDownload}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v9M5 8l3 3 3-3"/><path d="M2 13h12"/>
              </svg>
              <span className="hide-mobile">앱 만들기</span>
              <svg width="9" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M1 1l4 4 4-4"/>
              </svg>
            </button>
            {showDownload && (
              <>
                <div onClick={() => setShowDownload(false)} onKeyDown={(e) => { if (e.key === 'Escape') setShowDownload(false); }} role="presentation" style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 50, minWidth: 260,
                }}>
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1b1b1f", marginBottom: 3 }}>📲 Dalkak 앱 만들기</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>홈 화면에 추가하면 앱처럼 사용 가능 · 자동 업데이트</div>
                  </div>

                  {/* PWA 설치 버튼 — Chrome/Android에서 자동 감지 시 활성화 */}
                  {canInstall ? (
                    <button onClick={handleInstall} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "14px 16px", border: "none", background: "#fff7ed", cursor: "pointer",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>D</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>이 기기에 앱 설치</div>
                        <div style={{ fontSize: 11, color: "#9a3412" }}>클릭 한 번으로 홈 화면에 추가</div>
                      </div>
                    </button>
                  ) : (
                    <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", lineHeight: 2 }}>
                      📱 <b>iPhone/iPad</b> → Safari → 공유 → 홈 화면에 추가<br/>
                      🤖 <b>Android</b> → Chrome → 메뉴 → 앱 설치<br/>
                      💻 <b>PC</b> → Chrome 주소창 우측 <b>⊕</b> 버튼
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #f0f0f0", padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>데스크탑 앱 (출시 예정)</div>
                    {[{ os: "Windows", icon: "🪟" }, { os: "macOS", icon: "🍎" }, { os: "Linux", icon: "🐧" }].map(({ os, icon }) => (
                      <div key={os} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0", opacity: 0.45 }}>
                        <span style={{ fontSize: 14 }}>{icon}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{os} · 준비 중</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f0" }}>
                    <a href="/workspace" onClick={() => setShowDownload(false)} style={{
                      display: "block", textAlign: "center", padding: "9px 0", borderRadius: 8,
                      background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff",
                      fontSize: 13, fontWeight: 700, textDecoration: "none",
                    }}>
                      지금 웹에서 시작하기 →
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
              <a href="/workspace" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)", whiteSpace: "nowrap" }}>
                워크스페이스 →
              </a>
            </>
          ) : (
            <>
              <a href="/login" className="hide-mobile" style={{ padding: "7px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: "#374151", border: "1.5px solid #e5e7eb", background: "#fff" }}>
                로그인
              </a>
              <a href="/signup" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)", whiteSpace: "nowrap" }}>
                무료 시작
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="home-hero" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 72, paddingBottom: 64, paddingLeft: 24, paddingRight: 24,
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.09) 0%, transparent 70%)",
      }}>
        <div className="home-hero-badge" style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 22,
          padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)",
          background: "rgba(249,115,22,0.06)", fontSize: 12, fontWeight: 600, color: "#c2410c",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
          GPT-4o · Claude 3.5 · Gemini · Grok 3 실시간 사용 가능
        </div>

        <h1 className="home-hero-title" style={{
          fontSize: 56, fontWeight: 900, color: "#0f0f11", textAlign: "center",
          lineHeight: 1.08, marginBottom: 16, letterSpacing: "-0.03em", maxWidth: 820,
        }}>
          말하면 바로<br />
          <span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            앱이 만들어집니다
          </span>
        </h1>

        <p className="home-hero-sub" style={{
          fontSize: 17, color: "#6b7280", textAlign: "center", marginBottom: 32,
          fontWeight: 400, lineHeight: 1.65, maxWidth: 500,
        }}>
          설명만 하면 됩니다. AI가 코드 작성·디버깅·배포까지<br className="hide-mobile" />
          처리합니다. 코딩 지식이 없어도 됩니다.
        </p>

        <div style={{
          width: "100%", maxWidth: 740, background: "#fff",
          border: "1.5px solid #e5e7eb", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
        }}>
          <textarea
            className="home-prompt-textarea"
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleStart()}
            placeholder="만들고 싶은 앱을 설명해주세요... (예: 테트리스 게임 만들어줘, 유튜브 숏츠 자동생성기 만들어줘)"
            style={{
              width: "100%", padding: "18px 20px 0", fontSize: 15, color: "#1b1b1f",
              border: "none", outline: "none", resize: "none", minHeight: 88,
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
              <span className="hide-mobile" style={{ fontSize: 11, color: "#9ca3af" }}>자율성</span>
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
              만들기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 예시 프롬프트 클릭 시 자동 입력 */}
        <div className="home-example-chips" style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, maxWidth: 740,
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

      {/* ── How It Works ── */}
      <section className="home-how-section" id="how" style={{
        maxWidth: 960, margin: "0 auto", padding: "72px 24px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>작동 방식</p>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em" }}>3단계로 완성</h2>
        </div>
        <div className="home-step-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 48,
        }}>
          {[
            { step: "01", icon: "💬", title: "아이디어 입력", desc: "한국어로 만들고 싶은 걸 설명하세요. 아래 예시를 클릭해도 됩니다." },
            { step: "02", icon: "🤖", title: "AI가 코드 작성", desc: "선택한 AI 모델이 HTML·CSS·JS를 자동 생성하고 디버깅까지 완료합니다." },
            { step: "03", icon: "🚀", title: "즉시 배포·공유", desc: "한 클릭으로 공유 링크 생성. 업데이트되면 자동으로 반영됩니다." },
          ].map((s) => (
            <div key={s.step} style={{ textAlign: "center", padding: "32px 24px", borderRadius: 18, border: "1.5px solid #f0f0f0", background: "#fafafa" }}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#f97316", letterSpacing: "0.08em", marginBottom: 8 }}>STEP {s.step}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f0f11", marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", padding: "72px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>요금제</p>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em", marginBottom: 10 }}>투명한 가격</h2>
            <p style={{ fontSize: 14, color: "#6b7280" }}>14일 무료 체험 · 언제든 취소 · 신용카드 불필요</p>
          </div>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {PRICING.map((plan) => (
              <div key={plan.name} style={{
                background: "#fff",
                border: plan.highlight ? "2px solid #f97316" : "1.5px solid #e5e7eb",
                borderRadius: 18, padding: "26px 22px", position: "relative",
                boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.15)" : "none",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: 12, right: 14, background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>인기</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1b1b1f", marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>{plan.desc}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0f0f11", marginBottom: 3 }}>
                  {plan.price}<span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>/월</span>
                </div>
                {plan.original
                  ? <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through", marginBottom: 18 }}>{plan.original}</div>
                  : <div style={{ marginBottom: 18 }} />
                }
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                  {plan.features.map((f) => (
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

      {/* ── CTA Banner ── */}
      <section style={{ background: "linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #7c3aed 100%)", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>
            지금 바로 시작하세요
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.7 }}>
            무료로 시작하고 5분 안에 첫 번째 앱을 만들어보세요.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" style={{ padding: "13px 28px", borderRadius: 12, background: "#fff", color: "#f97316", textDecoration: "none", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
              무료로 시작하기 →
            </a>
            <a href="/pricing" style={{ padding: "13px 28px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700 }}>
              요금제 보기
            </a>
          </div>
        </div>
      </section>

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
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push("/"); } }}
            role="button"
            tabIndex={0}
            aria-label="Dalkak 홈으로 이동"
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
            AI 에이전트로 빠르게 앱을 만들고<br />스마트하게 배포하세요.
          </p>
        </div>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>서비스</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { href: "/workspace", label: "워크스페이스" },
                { href: "/gallery",   label: "갤러리" },
                { href: "/pricing",   label: "요금제" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>회사</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { href: "mailto:support@fieldnine.io", label: "고객 지원" },
                { href: "/privacy", label: "개인정보처리방침" },
                { href: "/terms",   label: "이용약관" },
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
