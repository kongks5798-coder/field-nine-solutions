"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { styled, globalStyles } from "@/lib/stitches.config";
import { AIMode } from "@/lib/ai/multiAI";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled("div", {
  minHeight: "100vh", background: "#fff", color: "#1b1b1f",
  fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
});

const Nav = styled("nav", {
  display: "flex", alignItems: "center", padding: "0 40px", height: 60,
  borderBottom: "1px solid rgba(0,0,0,0.07)",
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  position: "sticky", top: 0, zIndex: 100,
});

const NavLogo = styled("div", {
  display: "flex", alignItems: "center", gap: 9, fontWeight: 800,
  fontSize: 17, color: "#1b1b1f", cursor: "pointer", marginRight: 36, flexShrink: 0,
});

const LogoMark = styled("div", {
  width: 30, height: 30, borderRadius: 7,
  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 900, fontSize: 13, color: "#fff",
});

const NavLinks = styled("div", {
  display: "flex", alignItems: "center", gap: 2, flex: 1,
});

const NavLink = styled("a", {
  padding: "6px 13px", borderRadius: 7, fontSize: 14, color: "#4b5563",
  textDecoration: "none", fontWeight: 500, cursor: "pointer", transition: "all 0.12s",
  "&:hover": { background: "#f3f4f6", color: "#111" },
});

const NavRight = styled("div", {
  display: "flex", alignItems: "center", gap: 8,
});

// Hero
const Hero = styled("section", {
  display: "flex", flexDirection: "column", alignItems: "center",
  paddingTop: 80, paddingBottom: 72, paddingLeft: 24, paddingRight: 24,
  background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.08) 0%, transparent 70%)",
});

const HeroBadge = styled("div", {
  display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
  padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)",
  background: "rgba(249,115,22,0.06)", fontSize: 12, fontWeight: 600, color: "#c2410c",
});

const HeroTitle = styled("h1", {
  fontSize: 56, fontWeight: 900, color: "#0f0f11", textAlign: "center",
  lineHeight: 1.12, marginBottom: 16, letterSpacing: "-0.03em",
  "@media (max-width: 640px)": { fontSize: 36 },
});

const HeroSub = styled("p", {
  fontSize: 18, color: "#6b7280", textAlign: "center", marginBottom: 48,
  fontWeight: 400, lineHeight: 1.6, maxWidth: 520,
});

const PromptCard = styled("div", {
  width: "100%", maxWidth: 740, background: "#fff",
  border: "1.5px solid #e5e7eb", borderRadius: 18,
  boxShadow: "0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
});

const PromptTabs = styled("div", {
  display: "flex", borderBottom: "1px solid #f0f0f0", padding: "0 6px",
});

const PromptTab = styled("button", {
  display: "flex", alignItems: "center", gap: 6, padding: "13px 16px",
  background: "none", border: "none", fontSize: 13, fontWeight: 600,
  cursor: "pointer", color: "#9ca3af", borderBottom: "2px solid transparent",
  transition: "all 0.15s",
  variants: {
    active: {
      true: { color: "#1b1b1f", borderBottomColor: "#f97316" },
    },
  },
});

const PromptTextarea = styled("textarea", {
  width: "100%", padding: "20px 20px 0", fontSize: 15, color: "#1b1b1f",
  border: "none", outline: "none", resize: "none", minHeight: 100,
  fontFamily: "inherit", lineHeight: 1.65,
  "&::placeholder": { color: "#b0b8c4" },
});

const PromptBottom = styled("div", {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 16px",
});

// Section
const Section = styled("section", {
  maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px",
});

const SectionLabel = styled("p", {
  fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 12,
});

const SectionTitle = styled("h2", {
  fontSize: 34, fontWeight: 900, color: "#0f0f11", marginBottom: 14,
  letterSpacing: "-0.02em", lineHeight: 1.2,
});

const SectionSub = styled("p", {
  fontSize: 16, color: "#6b7280", marginBottom: 48, lineHeight: 1.7, maxWidth: 560,
});

const CategoryPills = styled("div", {
  display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap",
});

const Pill = styled("button", {
  padding: "7px 18px", borderRadius: 20, border: "1.5px solid #e5e7eb",
  fontSize: 13, fontWeight: 600, background: "#fff", color: "#4b5563",
  cursor: "pointer", transition: "all 0.15s",
  "&:hover": { borderColor: "#f97316", color: "#f97316" },
  variants: {
    active: { true: { borderColor: "#f97316", color: "#f97316", background: "#fff7ed" } },
  },
});

const CardGrid = styled("div", {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16,
});

const TemplateCard = styled("div", {
  border: "1.5px solid #e5e7eb", borderRadius: 14, overflow: "hidden",
  cursor: "pointer", transition: "all 0.2s", background: "#fff",
  "&:hover": { borderColor: "#f97316", boxShadow: "0 12px 32px rgba(0,0,0,0.1)", transform: "translateY(-3px)" },
});

const CardThumb = styled("div", {
  height: 130, display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 38, borderBottom: "1px solid #f3f4f6",
  variants: {
    color: {
      orange: { background: "linear-gradient(135deg, #fff7ed 0%, #fde68a 100%)" },
      blue:   { background: "linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)" },
      purple: { background: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)" },
      green:  { background: "linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)" },
      pink:   { background: "linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)" },
      gray:   { background: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)" },
    },
  },
});

const CardBody = styled("div", { padding: "14px 16px 18px" });
const CardTitle = styled("div", { fontWeight: 700, fontSize: 14, color: "#1b1b1f", marginBottom: 5 });
const CardDesc = styled("div", { fontSize: 12, color: "#6b7280", lineHeight: 1.6 });

// Feature cards
const FeatureGrid = styled("div", {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20,
});

// Pricing
const PricingGrid = styled("div", {
  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
  "@media (max-width: 768px)": { gridTemplateColumns: "1fr" },
});

// Footer
const Footer = styled("footer", {
  borderTop: "1px solid #f0f0f0", background: "#fafafa",
  padding: "40px 40px", display: "flex", justifyContent: "space-between",
  alignItems: "flex-start", flexWrap: "wrap", gap: 24,
});

// ─── AI Model Selector ────────────────────────────────────────────────────────

const AI_MODELS: { value: AIMode; label: string; color: string }[] = [
  { value: "openai",    label: "GPT-4o mini",        color: "#10b981" },
  { value: "anthropic", label: "Claude 3.5 Sonnet",  color: "#7c3aed" },
  { value: "gemini",    label: "Gemini 1.5 Flash",   color: "#3b82f6" },
  { value: "grok",      label: "Grok 3",             color: "#111827" },
];

function AIModelSelector({ value, onChange }: { value: AIMode; onChange: (v: AIMode) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = AI_MODELS.find(m => m.value === value) ?? AI_MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 12px", borderRadius: 20,
          border: "1.5px solid #e5e7eb", background: "#f9fafb",
          fontSize: 12, fontWeight: 600, color: "#374151",
          cursor: "pointer", transition: "all 0.12s",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: current.color, flexShrink: 0 }} />
        {current.label}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4, marginLeft: 2 }}>
          <path d="M1 1l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)", overflow: "hidden",
          zIndex: 50, minWidth: 180,
        }}>
          {AI_MODELS.map(m => (
            <button
              key={m.value}
              onClick={() => { onChange(m.value); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", border: "none",
                background: m.value === value ? "#fff7ed" : "#fff",
                fontSize: 13, fontWeight: m.value === value ? 700 : 500,
                color: m.value === value ? "#ea580c" : "#374151",
                cursor: "pointer", textAlign: "left", transition: "background 0.1s",
              }}
            >
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

// ─── Data ─────────────────────────────────────────────────────────────────────

type Category = "AI 앱" | "웹사이트" | "비즈니스" | "개인 소프트웨어";

const TEMPLATES: Record<Category, { icon: string; color: "orange" | "blue" | "purple" | "green" | "pink" | "gray"; title: string; desc: string; prompt: string }[]> = {
  "AI 앱": [
    { icon: "🤖", color: "orange", title: "AI 챗봇",       desc: "커스텀 AI 어시스턴트를 몇 분 만에 만들어보세요", prompt: "OpenAI API를 활용한 한국어 AI 챗봇 앱을 만들어줘" },
    { icon: "🧠", color: "purple", title: "AI 코드 리뷰어", desc: "코드를 붙여넣으면 AI가 리뷰해주는 앱",            prompt: "코드를 입력하면 AI가 리뷰해주고 개선점을 알려주는 앱 만들어줘" },
    { icon: "📝", color: "blue",   title: "AI 문서 요약기", desc: "긴 문서를 AI가 핵심만 요약해줘요",                 prompt: "문서를 업로드하면 AI가 요약해주는 앱을 만들어줘" },
    { icon: "🎨", color: "pink",   title: "이미지 생성기",  desc: "텍스트로 이미지를 만드는 AI 앱",                  prompt: "DALL-E API로 텍스트를 이미지로 변환하는 앱 만들어줘" },
  ],
  "웹사이트": [
    { icon: "🏪", color: "orange", title: "쇼핑몰",      desc: "상품 진열부터 결제까지 완성형 쇼핑몰",   prompt: "모바일 친화적인 한국어 쇼핑몰 웹사이트 만들어줘" },
    { icon: "📰", color: "blue",   title: "뉴스 블로그",  desc: "깔끔한 뉴스/블로그 사이트",              prompt: "SEO 최적화된 한국어 뉴스 블로그 웹사이트 만들어줘" },
    { icon: "💼", color: "gray",   title: "포트폴리오",  desc: "나만의 개발자 포트폴리오 사이트",         prompt: "세련된 개발자 포트폴리오 웹사이트 만들어줘" },
    { icon: "🏠", color: "green",  title: "랜딩 페이지", desc: "전환율 높은 SaaS 랜딩 페이지",            prompt: "전환율 최적화된 SaaS 서비스 한국어 랜딩 페이지 만들어줘" },
  ],
  "비즈니스": [
    { icon: "📊", color: "blue",   title: "대시보드",   desc: "실시간 데이터를 시각화하는 관리자 대시보드", prompt: "실시간 차트와 통계가 있는 비즈니스 대시보드 만들어줘" },
    { icon: "👥", color: "purple", title: "CRM 시스템", desc: "고객 관리를 한 곳에서 처리하는 CRM",         prompt: "고객 정보 관리, 상담 이력 추적 기능이 있는 CRM 만들어줘" },
    { icon: "📅", color: "orange", title: "예약 시스템", desc: "온라인 예약을 받을 수 있는 시스템",          prompt: "캘린더 기반의 온라인 예약 시스템 만들어줘" },
    { icon: "📦", color: "green",  title: "재고 관리",  desc: "입출고, 재고 현황 관리 시스템",              prompt: "바코드 스캔, 입출고 관리, 재고 현황 조회가 되는 시스템 만들어줘" },
  ],
  "개인 소프트웨어": [
    { icon: "✅", color: "green",  title: "할 일 관리", desc: "습관 추적 기능까지 갖춘 스마트 할일 앱",    prompt: "습관 추적, 우선순위 설정이 되는 스마트 할일 앱 만들어줘" },
    { icon: "💰", color: "orange", title: "가계부",     desc: "수입/지출을 분석해주는 개인 가계부",         prompt: "카테고리별 지출 분석, 월별 리포트 기능이 있는 가계부 앱 만들어줘" },
    { icon: "📚", color: "blue",   title: "독서 기록",  desc: "읽은 책을 기록하고 리뷰하는 앱",             prompt: "독서 목록, 리뷰, 읽기 진행률을 관리하는 독서 기록 앱 만들어줘" },
    { icon: "🏃", color: "pink",   title: "운동 트래커", desc: "운동 루틴을 기록하고 분석해요",              prompt: "운동 루틴 설정, 기록, 진행 그래프가 있는 운동 트래커 만들어줘" },
  ],
};

const CATEGORIES: Category[] = ["AI 앱", "웹사이트", "비즈니스", "개인 소프트웨어"];

const FEATURES = [
  {
    icon: "🤖",
    title: "멀티 AI 엔진",
    desc: "GPT-4o, Claude 3.5, Gemini 1.5, Grok 3 — 상황에 맞는 최적의 AI를 선택하세요.",
    color: "#f97316",
  },
  {
    icon: "⚡",
    title: "30초 앱 완성",
    desc: "아이디어를 입력하면 즉시 완성된 웹 앱 코드가 생성됩니다. 배포까지 단 3분.",
    color: "#eab308",
  },
  {
    icon: "👥",
    title: "실시간 팀 협업",
    desc: "팀원들과 채팅, 공유 문서 편집, AI 어시스턴트를 함께 활용하세요.",
    color: "#3b82f6",
  },
  {
    icon: "☁️",
    title: "클라우드 스토리지",
    desc: "파일을 안전하게 저장하고, 어디서나 팀과 공유하세요. 100GB 기본 제공.",
    color: "#06b6d4",
  },
  {
    icon: "🔒",
    title: "엔터프라이즈 보안",
    desc: "Supabase RLS, JWT 인증, HTTPS 암호화로 데이터를 안전하게 보호합니다.",
    color: "#8b5cf6",
  },
  {
    icon: "🌐",
    title: "글로벌 CDN 배포",
    desc: "Vercel + Cloudflare로 전 세계 어디서나 빠른 속도로 서비스됩니다.",
    color: "#10b981",
  },
];

const PLANS = [
  {
    name: "스타터",
    price: "무료",
    original: "",
    priceDesc: "영원히",
    badge: null,
    features: [
      { text: "워크스페이스 3개", ok: true },
      { text: "AI 코드 생성 월 100회", ok: true },
      { text: "1GB 클라우드 스토리지", ok: true },
      { text: "기본 팀 협업 (3명)", ok: true },
      { text: "커뮤니티 지원", ok: true },
      { text: "고급 AI 모델 (GPT-4o, Claude)", ok: false },
      { text: "우선 기술 지원", ok: false },
    ],
    cta: "무료로 시작",
    ctaHref: "/signup",
    highlight: false,
  },
  {
    name: "프로",
    price: "₩39,000",
    original: "₩49,000",
    priceDesc: "/ 월",
    badge: "가장 인기 · 20% 할인",
    features: [
      { text: "워크스페이스 무제한", ok: true },
      { text: "AI 요청 무제한", ok: true },
      { text: "50GB 클라우드 스토리지", ok: true },
      { text: "팀 협업 (10명)", ok: true },
      { text: "우선 기술 지원", ok: true },
      { text: "API 직접 연동", ok: true },
      { text: "GPT-4o · Claude Sonnet · Grok 3", ok: true },
    ],
    cta: "프로 시작",
    ctaHref: "/pricing",
    highlight: true,
  },
  {
    name: "팀",
    price: "₩99,000",
    original: "₩129,000",
    priceDesc: "/ 월",
    badge: "23% 할인",
    features: [
      { text: "프로 모든 기능 포함", ok: true },
      { text: "팀원 무제한", ok: true },
      { text: "200GB 클라우드 스토리지", ok: true },
      { text: "전담 매니저", ok: true },
      { text: "SSO / SAML 인증", ok: true },
      { text: "SLA 보장", ok: true },
      { text: "맞춤형 계약", ok: true },
    ],
    cta: "영업팀 문의",
    ctaHref: "mailto:sales@fieldnine.io",
    highlight: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  globalStyles();

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [promptTab, setPromptTab] = useState<"app" | "design">("app");
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("openai");
  const [category, setCategory] = useState<Category>("AI 앱");

  // Auth state — 로그인 여부 실시간 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const getUserDisplay = (u: User) =>
    u.user_metadata?.name ||
    u.user_metadata?.full_name ||
    u.email?.split("@")[0] ||
    "사용자";

  const handleStart = () => {
    if (!prompt.trim()) return;
    const ideUrl = `/workspace?q=${encodeURIComponent(prompt)}&mode=${aiMode}`;
    if (user) {
      router.push(ideUrl);
    } else {
      router.push(`/login?next=${encodeURIComponent(ideUrl)}`);
    }
  };

  const handleTemplate = (tmpl: { prompt: string }) => {
    const ideUrl = `/workspace?q=${encodeURIComponent(tmpl.prompt)}&mode=${aiMode}`;
    if (user) {
      router.push(ideUrl);
    } else {
      router.push(`/login?next=${encodeURIComponent(ideUrl)}`);
    }
  };

  const displayName = user ? getUserDisplay(user) : null;

  return (
    <Page>
      {/* ── Nav ── */}
      <Nav>
        <NavLogo onClick={() => router.push("/")}>
          <LogoMark>F9</LogoMark>
          FieldNine
        </NavLogo>
        <NavLinks>
          <NavLink href="#features">제품</NavLink>
          <NavLink href="#pricing">요금제</NavLink>
          <NavLink href="mailto:support@fieldnine.io">리소스</NavLink>
        </NavLinks>
        <NavRight>
          {user ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 12px", borderRadius: 8,
                background: "#f3f4f6", fontSize: 13, color: "#374151",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                  {displayName!.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600 }}>{displayName}</span>
              </div>
              <a
                href="/workspace"
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
                  color: "#fff",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                }}
              >
                워크스페이스 →
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  textDecoration: "none", color: "#374151",
                  border: "1.5px solid #e5e7eb", background: "#fff",
                  transition: "all 0.15s",
                }}
              >
                로그인
              </a>
              <a
                href="/signup"
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
                  color: "#fff",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
                }}
              >
                무료 시작
              </a>
            </>
          )}
        </NavRight>
      </Nav>

      {/* ── Hero ── */}
      <Hero>
        <HeroBadge>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#f97316", display: "inline-block",
          }} />
          GPT-4o · Claude 3.5 · Gemini 1.5 · Grok 3
        </HeroBadge>
        <HeroTitle>무엇을 만들어드릴까요?</HeroTitle>
        <HeroSub>아이디어를 입력하면 AI가 즉시 만들어드립니다</HeroSub>

        <PromptCard>
          <PromptTabs>
            <PromptTab active={promptTab === "app"} onClick={() => setPromptTab("app")}>
              ⚡ 앱
            </PromptTab>
            <PromptTab active={promptTab === "design"} onClick={() => setPromptTab("design")}>
              🎨 디자인
            </PromptTab>
          </PromptTabs>

          <PromptTextarea
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.metaKey && handleStart()}
            placeholder={
              promptTab === "app"
                ? "만들고 싶은 앱을 설명해주세요... (예: 한국어 AI 챗봇, 재고 관리 시스템, 포트폴리오 사이트)"
                : "어떤 디자인이 필요한가요? (예: 다크 모드 대시보드, 쇼핑몰 UI, 랜딩 페이지)"
            }
          />

          <PromptBottom>
            <AIModelSelector value={aiMode} onChange={setAiMode} />
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10, border: "none",
                background: !prompt.trim()
                  ? "#f3f4f6"
                  : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: !prompt.trim() ? "#9ca3af" : "#fff",
                fontSize: 14, fontWeight: 700, cursor: !prompt.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                boxShadow: !prompt.trim() ? "none" : "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              만들기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </PromptBottom>
        </PromptCard>
      </Hero>

      {/* ── Templates ── */}
      <Section id="examples" style={{ paddingTop: 8 }}>
        <SectionLabel>TEMPLATES</SectionLabel>
        <SectionTitle>아이디어로 시작하세요</SectionTitle>
        <CategoryPills>
          {CATEGORIES.map(c => (
            <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Pill>
          ))}
        </CategoryPills>
        <CardGrid>
          {TEMPLATES[category].map((tmpl, i) => (
            <TemplateCard key={i} onClick={() => handleTemplate(tmpl)}>
              <CardThumb color={tmpl.color}>{tmpl.icon}</CardThumb>
              <CardBody>
                <CardTitle>{tmpl.title}</CardTitle>
                <CardDesc>{tmpl.desc}</CardDesc>
              </CardBody>
            </TemplateCard>
          ))}
        </CardGrid>
      </Section>

      {/* ── Features ── */}
      <section id="features" style={{
        background: "#fafafa", borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0",
        padding: "80px 0",
      }}>
        <Section style={{ paddingBottom: 0, paddingTop: 0 }}>
          <SectionLabel>왜 FieldNine인가</SectionLabel>
          <SectionTitle>강력함, 단순함, 빠름</SectionTitle>
          <SectionSub>
            복잡한 개발 없이도 엔터프라이즈급 AI 앱을 만들 수 있습니다.
          </SectionSub>
          <FeatureGrid>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: "24px", background: "#fff", borderRadius: 14,
                border: "1.5px solid #f0f0f0", transition: "all 0.2s",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                  background: `${f.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f0f11", marginBottom: 8 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </FeatureGrid>
        </Section>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "80px 0" }}>
        <Section style={{ paddingBottom: 0, paddingTop: 0 }}>
          <SectionLabel>요금제</SectionLabel>
          <SectionTitle>투명한 가격</SectionTitle>
          <SectionSub>
            숨겨진 비용 없이 필요한 만큼만 사용하세요.
          </SectionSub>
          <PricingGrid>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                padding: "32px 28px", borderRadius: 18,
                border: plan.highlight ? "2px solid #f97316" : "1.5px solid #e5e7eb",
                background: plan.highlight ? "linear-gradient(180deg, #fff7ed 0%, #fff 40%)" : "#fff",
                position: "relative",
                boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 16px 40px rgba(249,115,22,0.18)" : "0 8px 28px rgba(0,0,0,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = plan.highlight ? "0 8px 32px rgba(249,115,22,0.12)" : "0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: plan.highlight ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)" : "#1b1b1f",
                    color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px",
                    borderRadius: 20, whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: 18, color: "#0f0f11", marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: plan.original ? 4 : 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em" }}>{plan.price}</span>
                  {plan.priceDesc && (
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>{plan.priceDesc}</span>
                  )}
                </div>
                {plan.original && (
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ textDecoration: "line-through" }}>정가 {plan.original}</span>
                    <span style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700, padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>
                      {plan.badge?.includes("20%") ? "20% 절약" : plan.badge?.includes("23%") ? "23% 절약" : "할인"}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((feat, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: feat.ok ? "#374151" : "#c4c9d4" }}>
                      {feat.ok ? (
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="7.5" cy="7.5" r="7" fill={plan.highlight ? "#f97316" : "#22c55e"}/>
                          <path d="M4.5 7.5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="7.5" cy="7.5" r="7" fill="#f1f5f9"/>
                          <path d="M5 5l5 5M10 5l-5 5" stroke="#c4c9d4" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                      )}
                      {feat.text}
                    </div>
                  ))}
                </div>
                <a
                  href={plan.ctaHref}
                  style={{
                    display: "block", padding: "12px 0", borderRadius: 10,
                    textAlign: "center", textDecoration: "none",
                    fontSize: 14, fontWeight: 700, transition: "all 0.15s",
                    background: plan.highlight
                      ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)"
                      : "transparent",
                    color: plan.highlight ? "#fff" : "#374151",
                    border: plan.highlight ? "none" : "1.5px solid #e5e7eb",
                    boxShadow: plan.highlight ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </PricingGrid>
        </Section>
      </section>

      {/* ── Footer ── */}
      <Footer>
        <div>
          <NavLogo style={{ marginBottom: 12 }}>
            <LogoMark>F9</LogoMark>
            FieldNine
          </NavLogo>
          <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 240, lineHeight: 1.7 }}>
            AI로 더 빠르게 만들고,<br />더 스마트하게 협업하세요.
          </p>
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>
              서비스
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/workspace", label: "워크스페이스" },
                { href: "/team",      label: "팀 협업" },
                { href: "/cloud",     label: "클라우드" },
                { href: "/cowork",    label: "코워크" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>
              법적 고지
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/privacy", label: "개인정보처리방침" },
                { href: "/terms",   label: "이용약관" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#c4c9d4", alignSelf: "flex-end" }}>
          © 2026 FieldNine Inc. All rights reserved.
        </div>
      </Footer>
    </Page>
  );
}
