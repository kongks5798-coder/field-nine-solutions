"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  background: "rgba(255,255,255,0.9)",
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

const Hero = styled("section", {
  display: "flex", flexDirection: "column", alignItems: "center",
  paddingTop: 90, paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
  background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.09) 0%, transparent 70%)",
  position: "relative", overflow: "hidden",
});

const HeroBadge = styled("div", {
  display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
  padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)",
  background: "rgba(249,115,22,0.06)", fontSize: 12, fontWeight: 600, color: "#c2410c",
});

const HeroTitle = styled("h1", {
  fontSize: 62, fontWeight: 900, color: "#0f0f11", textAlign: "center",
  lineHeight: 1.08, marginBottom: 18, letterSpacing: "-0.03em", maxWidth: 860,
  "@media (max-width: 768px)": { fontSize: 40 },
  "@media (max-width: 480px)": { fontSize: 32 },
});

const HeroSub = styled("p", {
  fontSize: 19, color: "#6b7280", textAlign: "center", marginBottom: 48,
  fontWeight: 400, lineHeight: 1.65, maxWidth: 560,
  "@media (max-width: 640px)": { fontSize: 16 },
});

const PromptCard = styled("div", {
  width: "100%", maxWidth: 760, background: "#fff",
  border: "1.5px solid #e5e7eb", borderRadius: 20,
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
    active: { true: { color: "#1b1b1f", borderBottomColor: "#f97316" } },
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
  padding: "14px 16px", gap: 8, flexWrap: "wrap",
});

const Section = styled("section", {
  maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px",
});

const SectionLabel = styled("p", {
  fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 12,
});

const SectionTitle = styled("h2", {
  fontSize: 36, fontWeight: 900, color: "#0f0f11", marginBottom: 14,
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

const FeatureGrid = styled("div", {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20,
});

const Footer = styled("footer", {
  borderTop: "1px solid #f0f0f0", background: "#fafafa",
  padding: "48px 40px", display: "flex", justifyContent: "space-between",
  alignItems: "flex-start", flexWrap: "wrap", gap: 32,
});

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
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 20,
        border: "1.5px solid #e5e7eb", background: "#f9fafb", fontSize: 12, fontWeight: 600,
        color: "#374151", cursor: "pointer", transition: "all 0.12s",
      }}>
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "200만+", label: "전 세계 개발자" },
  { value: "5천만+", label: "생성된 앱" },
  { value: "150+",   label: "지원 국가" },
  { value: "40+",    label: "연동 서비스" },
];

const HOW_IT_WORKS = [
  {
    step: "01", icon: "💬", title: "아이디어를 입력하세요",
    desc: "만들고 싶은 앱을 한국어로 설명하세요. AI 에이전트가 요구사항을 이해합니다.",
  },
  {
    step: "02", icon: "🤖", title: "에이전트가 코드를 작성합니다",
    desc: "선택한 자율성 수준에 따라 에이전트가 HTML, CSS, JS를 자동으로 생성합니다.",
  },
  {
    step: "03", icon: "🚀", title: "즉시 배포하세요",
    desc: "한 클릭으로 공유 가능한 링크를 생성합니다. 전 세계 어디서나 접근 가능합니다.",
  },
];

const AUTONOMY_LEVELS = [
  {
    id: "low", icon: "🎮", name: "낮음 (Low)",
    desc: "모든 단계에서 확인 요청. 사용자가 완전히 제어합니다.",
    color: "#60a5fa", bg: "#eff6ff", border: "#bfdbfe",
    features: ["단계별 승인", "코드 미리보기", "안전한 실행"],
  },
  {
    id: "medium", icon: "⚖️", name: "보통 (Medium)",
    desc: "중요한 결정만 확인합니다. 균형잡힌 자율성.",
    color: "#a78bfa", bg: "#f5f3ff", border: "#ddd6fe",
    features: ["핵심만 확인", "자동 최적화", "스마트 제안"],
  },
  {
    id: "high", icon: "🚀", name: "높음 (High)",
    desc: "완성 후 보고합니다. 빠른 개발에 최적화.",
    color: "#f97316", bg: "#fff7ed", border: "#fed7aa",
    features: ["완성 후 보고", "자동 리팩토링", "빠른 반복"],
  },
  {
    id: "max", icon: "🤖", name: "최대 (Max)",
    desc: "완전 자율 실행. 에이전트가 모든 결정을 내립니다.",
    color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3",
    features: ["완전 자율", "다중 파일 자동 생성", "지속적 개선"],
  },
];

const CONNECTORS = [
  { icon: "🐘", name: "PostgreSQL" }, { icon: "🐬", name: "MySQL" }, { icon: "🍃", name: "MongoDB" },
  { icon: "🔴", name: "Redis" },       { icon: "⚡", name: "Supabase" }, { icon: "🔥", name: "Firebase" },
  { icon: "💳", name: "Stripe" },     { icon: "🇰🇷", name: "토스페이먼츠" }, { icon: "💰", name: "PayPal" },
  { icon: "☁️", name: "AWS S3" },     { icon: "🌐", name: "Cloudflare" }, { icon: "📁", name: "Google Drive" },
  { icon: "🐙", name: "GitHub" },     { icon: "🦊", name: "GitLab" },   { icon: "💬", name: "Slack" },
  { icon: "🎮", name: "Discord" },    { icon: "📝", name: "Notion" },   { icon: "📊", name: "Airtable" },
  { icon: "🤖", name: "OpenAI" },     { icon: "🧠", name: "Anthropic" }, { icon: "✨", name: "Gemini" },
  { icon: "🤗", name: "Hugging Face" },{ icon: "🖼️", name: "Replicate" },{ icon: "📱", name: "Kakao" },
  { icon: "🟢", name: "Naver" },      { icon: "📲", name: "LINE" },     { icon: "📧", name: "SendGrid" },
  { icon: "📞", name: "Twilio" },     { icon: "🛒", name: "Shopify" },  { icon: "🏪", name: "WooCommerce" },
  { icon: "📈", name: "Google Analytics" },{ icon: "🔍", name: "Mixpanel" },{ icon: "📉", name: "Amplitude" },
  { icon: "▲", name: "Vercel" },      { icon: "🚂", name: "Railway" },  { icon: "🐳", name: "Docker" },
  { icon: "🌊", name: "DigitalOcean" },{ icon: "☁️", name: "GCP" },    { icon: "🔷", name: "Azure" },
  { icon: "+", name: "더 보기..." },
];

const ENTERPRISE_FEATURES = [
  { icon: "🔒", title: "SOC 2 Type II 인증", desc: "엔터프라이즈급 보안 기준을 준수합니다." },
  { icon: "🔑", title: "SSO / SAML 2.0", desc: "기존 인증 시스템과 원활하게 통합됩니다." },
  { icon: "🌏", title: "데이터 주권 선택", desc: "한국, 미국, EU 리전 중 선택 가능합니다." },
  { icon: "📋", title: "감사 로그", desc: "모든 활동을 추적하고 컴플라이언스를 유지합니다." },
  { icon: "👥", title: "팀 권한 관리", desc: "세분화된 역할과 권한으로 팀을 안전하게 관리합니다." },
  { icon: "🛡️", title: "전용 인프라", desc: "격리된 환경에서 데이터를 안전하게 보호합니다." },
];

type Category = "AI 앱" | "웹사이트" | "비즈니스" | "개인 소프트웨어";

const TEMPLATES: Record<Category, { icon: string; color: "orange" | "blue" | "purple" | "green" | "pink" | "gray"; title: string; desc: string; prompt: string }[]> = {
  "AI 앱": [
    { icon: "🤖", color: "orange", title: "AI 챗봇",       desc: "커스텀 AI 어시스턴트를 몇 분 만에", prompt: "OpenAI API를 활용한 한국어 AI 챗봇 앱을 만들어줘" },
    { icon: "🧠", color: "purple", title: "AI 코드 리뷰어", desc: "코드를 붙여넣으면 AI가 리뷰해줘요", prompt: "코드를 입력하면 AI가 리뷰해주고 개선점을 알려주는 앱 만들어줘" },
    { icon: "📝", color: "blue",   title: "AI 문서 요약기", desc: "긴 문서를 AI가 핵심만 요약해줘요",  prompt: "문서를 업로드하면 AI가 요약해주는 앱을 만들어줘" },
    { icon: "🎨", color: "pink",   title: "이미지 생성기",  desc: "텍스트로 이미지를 만드는 AI 앱",   prompt: "DALL-E API로 텍스트를 이미지로 변환하는 앱 만들어줘" },
  ],
  "웹사이트": [
    { icon: "🏪", color: "orange", title: "쇼핑몰",      desc: "상품 진열부터 결제까지 완성형",    prompt: "모바일 친화적인 한국어 쇼핑몰 웹사이트 만들어줘" },
    { icon: "📰", color: "blue",   title: "뉴스 블로그",  desc: "깔끔한 뉴스/블로그 사이트",        prompt: "SEO 최적화된 한국어 뉴스 블로그 웹사이트 만들어줘" },
    { icon: "💼", color: "gray",   title: "포트폴리오",  desc: "나만의 개발자 포트폴리오 사이트",   prompt: "세련된 개발자 포트폴리오 웹사이트 만들어줘" },
    { icon: "🏠", color: "green",  title: "랜딩 페이지", desc: "전환율 높은 SaaS 랜딩 페이지",      prompt: "전환율 최적화된 SaaS 서비스 한국어 랜딩 페이지 만들어줘" },
  ],
  "비즈니스": [
    { icon: "📊", color: "blue",   title: "대시보드",   desc: "실시간 데이터 시각화 관리자 패널",   prompt: "실시간 차트와 통계가 있는 비즈니스 대시보드 만들어줘" },
    { icon: "👥", color: "purple", title: "CRM 시스템", desc: "고객 관리를 한 곳에서",              prompt: "고객 정보 관리, 상담 이력 추적 기능이 있는 CRM 만들어줘" },
    { icon: "📅", color: "orange", title: "예약 시스템", desc: "온라인 예약을 받을 수 있는 시스템", prompt: "캘린더 기반의 온라인 예약 시스템 만들어줘" },
    { icon: "📦", color: "green",  title: "재고 관리",  desc: "입출고, 재고 현황 관리",             prompt: "바코드 스캔, 입출고 관리, 재고 현황 조회가 되는 시스템 만들어줘" },
  ],
  "개인 소프트웨어": [
    { icon: "✅", color: "green",  title: "할 일 관리", desc: "습관 추적 기능까지 갖춘 스마트",     prompt: "습관 추적, 우선순위 설정이 되는 스마트 할일 앱 만들어줘" },
    { icon: "💰", color: "orange", title: "가계부",     desc: "수입/지출을 분석해주는 가계부",       prompt: "카테고리별 지출 분석, 월별 리포트 기능이 있는 가계부 앱 만들어줘" },
    { icon: "📚", color: "blue",   title: "독서 기록",  desc: "읽은 책을 기록하고 리뷰하는 앱",     prompt: "독서 목록, 리뷰, 읽기 진행률을 관리하는 독서 기록 앱 만들어줘" },
    { icon: "🏃", color: "pink",   title: "운동 트래커", desc: "운동 루틴을 기록하고 분석해요",     prompt: "운동 루틴 설정, 기록, 진행 그래프가 있는 운동 트래커 만들어줘" },
  ],
};

const CATEGORIES: Category[] = ["AI 앱", "웹사이트", "비즈니스", "개인 소프트웨어"];

const VS_REPLIT = [
  { feature: "멀티 AI 선택 (GPT·Claude·Gemini·Grok)", fieldnine: true,  replit: false },
  { feature: "한국어 완전 최적화",                     fieldnine: true,  replit: false },
  { feature: "실시간 코드 미리보기",                   fieldnine: true,  replit: true  },
  { feature: "스크린샷 → 코드 (Vision)",               fieldnine: true,  replit: false },
  { feature: "실시간 웹 검색 (Grok)",                  fieldnine: true,  replit: false },
  { feature: "실시간 팀 협업",                         fieldnine: true,  replit: true  },
  { feature: "AI 에러 자동 수정",                      fieldnine: true,  replit: true  },
  { feature: "오픈 소스 완전 제어",                    fieldnine: true,  replit: false },
  { feature: "프로 플랜 가격",                          fieldnine: "₩39,000/월", replit: "$25/월(≈₩35,000)" },
  { feature: "팀 플랜 가격",                           fieldnine: "₩99,000/월", replit: "$40+/월" },
];

const FEATURES = [
  { icon: "🤖", title: "멀티 AI 오케스트레이션", desc: "GPT-4o, Claude 3.5, Gemini 1.5, Grok 3 — 상황에 맞는 최적의 AI를 자동 선택하거나 직접 선택하세요.", color: "#f97316" },
  { icon: "⚡", title: "30초 앱 완성",           desc: "아이디어를 입력하면 즉시 완성된 웹 앱 코드가 생성됩니다. 배포까지 단 3분이면 충분합니다.", color: "#eab308" },
  { icon: "👥", title: "실시간 팀 협업",          desc: "팀원들과 채팅, 공유 문서 편집, AI 어시스턴트를 함께 활용하세요. 어디서나 동시 작업 가능합니다.", color: "#3b82f6" },
  { icon: "☁️", title: "클라우드 스토리지",       desc: "파일을 안전하게 저장하고, 어디서나 팀과 공유하세요. 100GB 기본 제공됩니다.", color: "#06b6d4" },
  { icon: "🔒", title: "엔터프라이즈 보안",        desc: "SOC 2 Type II, JWT 인증, HTTPS 암호화, SSO/SAML로 데이터를 완벽하게 보호합니다.", color: "#8b5cf6" },
  { icon: "🌐", title: "글로벌 CDN 배포",          desc: "Vercel + Cloudflare로 전 세계 어디서나 초고속으로 서비스됩니다. 150+ 국가 지원.", color: "#10b981" },
];

const PLANS = [
  {
    name: "프로", price: "₩39,000", original: "₩49,000", priceDesc: "/ 월", badge: "가장 인기",
    features: [
      { text: "워크스페이스 무제한",             ok: true },
      { text: "AI 요청 무제한",                  ok: true },
      { text: "클라우드 스토리지 50GB",          ok: true },
      { text: "팀 협업 (10명)",                  ok: true },
      { text: "GPT-4o · Claude · Gemini · Grok", ok: true },
      { text: "우선 기술 지원",                  ok: true },
      { text: "자율성 전체 (Max 포함)",          ok: true },
    ],
    cta: "프로 시작", ctaHref: "/pricing", highlight: true,
  },
  {
    name: "팀", price: "₩99,000", original: "₩129,000", priceDesc: "/ 월", badge: "엔터프라이즈",
    features: [
      { text: "프로 모든 기능 포함",         ok: true },
      { text: "팀원 무제한",                 ok: true },
      { text: "클라우드 스토리지 200GB",     ok: true },
      { text: "전담 계정 매니저",            ok: true },
      { text: "SSO / SAML 2.0",             ok: true },
      { text: "SLA 99.9% 보장",              ok: true },
      { text: "맞춤형 계약 · 볼륨 할인",     ok: true },
    ],
    cta: "팀 플랜 문의", ctaHref: "/pricing", highlight: false,
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
  const [activeAutonomy, setActiveAutonomy] = useState("high");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { setUser(session?.user ?? null); });
    return () => subscription.unsubscribe();
  }, []);

  const getUserDisplay = (u: User) =>
    u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "사용자";

  const handleStart = () => {
    if (!prompt.trim()) return;
    const ideUrl = `/workspace?q=${encodeURIComponent(prompt)}&mode=${aiMode}&autonomy=${activeAutonomy}`;
    router.push(user ? ideUrl : `/login?next=${encodeURIComponent(ideUrl)}`);
  };

  const handleTemplate = (tmpl: { prompt: string }) => {
    const ideUrl = `/workspace?q=${encodeURIComponent(tmpl.prompt)}&mode=${aiMode}&autonomy=${activeAutonomy}`;
    router.push(user ? ideUrl : `/login?next=${encodeURIComponent(ideUrl)}`);
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
        <NavLinks className="nav-links">
          <NavLink href="#how">작동 방식</NavLink>
          <NavLink href="#autonomy">에이전트</NavLink>
          <NavLink href="#features">제품</NavLink>
          <NavLink href="#pricing">요금제</NavLink>
          <NavLink href="#enterprise">엔터프라이즈</NavLink>
        </NavLinks>
        <NavRight>
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8, background: "#f3f4f6", fontSize: 13, color: "#374151" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {displayName!.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600 }}>{displayName}</span>
              </div>
              <a href="/workspace" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)" }}>
                워크스페이스 →
              </a>
            </>
          ) : (
            <>
              <a href="/login" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: "#374151", border: "1.5px solid #e5e7eb", background: "#fff" }}>
                로그인
              </a>
              <a href="/signup" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: "#fff", background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)" }}>
                무료 시작
              </a>
            </>
          )}
        </NavRight>
      </Nav>

      {/* ── Hero ── */}
      <Hero>
        <HeroBadge>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
          AI 에이전트 · GPT-4o · Claude 3.5 · Gemini · Grok 3
        </HeroBadge>
        <HeroTitle>
          AI 에이전트가<br />
          <span style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            앱을 만들어드립니다
          </span>
        </HeroTitle>
        <HeroSub>
          설명만 하면 됩니다. 에이전트가 코드 작성, 디버깅,<br />
          배포까지 모두 처리합니다. 코딩 지식이 없어도 됩니다.
        </HeroSub>

        <PromptCard>
          <PromptTabs>
            <PromptTab active={promptTab === "app"} onClick={() => setPromptTab("app")}>⚡ 앱</PromptTab>
            <PromptTab active={promptTab === "design"} onClick={() => setPromptTab("design")}>🎨 디자인</PromptTab>
          </PromptTabs>
          <PromptTextarea
            rows={4} value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.metaKey && handleStart()}
            placeholder={
              promptTab === "app"
                ? "만들고 싶은 앱을 설명해주세요... (예: AI 챗봇, 재고 관리 시스템, 포트폴리오 사이트)"
                : "어떤 디자인이 필요한가요? (예: 다크 모드 대시보드, 쇼핑몰 UI, 랜딩 페이지)"
            }
          />
          <PromptBottom>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <AIModelSelector value={aiMode} onChange={setAiMode} />
              {/* Autonomy level selector */}
              <div style={{ display: "flex", gap: 3, background: "#f3f4f6", borderRadius: 20, padding: "3px 4px" }}>
                {[
                  { id: "low", label: "Low", color: "#60a5fa" },
                  { id: "medium", label: "Mid", color: "#a78bfa" },
                  { id: "high", label: "High", color: "#f97316" },
                  { id: "max", label: "Max", color: "#f43f5e" },
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
              <span style={{ fontSize: 11, color: "#9ca3af" }}>자율성 수준</span>
            </div>
            <button
              onClick={handleStart}
              disabled={!prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
                borderRadius: 10, border: "none",
                background: !prompt.trim() ? "#f3f4f6" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: !prompt.trim() ? "#9ca3af" : "#fff", fontSize: 14, fontWeight: 700,
                cursor: !prompt.trim() ? "not-allowed" : "pointer",
                boxShadow: !prompt.trim() ? "none" : "0 4px 14px rgba(249,115,22,0.35)",
                flexShrink: 0,
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

      {/* ── Stats ── */}
      <div style={{ borderTop: "1px solid #f0f0f0", borderBottom: "1px solid #f0f0f0", background: "#fafafa", padding: "28px 24px" }}>
        <div className="stats-grid" style={{ maxWidth: 860, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <section id="how" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0f0f11", textAlign: "center", marginBottom: 14, letterSpacing: "-0.02em" }}>
            3단계로 앱을 만드세요
          </h2>
          <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 64, lineHeight: 1.7 }}>
            코딩 지식이 없어도 됩니다. AI 에이전트가 모든 것을 처리합니다.
          </p>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, position: "relative" }}>
            {/* connector line */}
            <div style={{ position: "absolute", top: 32, left: "calc(16.67% + 16px)", right: "calc(16.67% + 16px)", height: 1, background: "linear-gradient(90deg, #f97316, #f43f5e)", zIndex: 0, opacity: 0.3 }} />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #fff7ed, #fde68a)", border: "2px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(249,115,22,0.15)" }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", letterSpacing: "0.06em", marginBottom: 8 }}>STEP {step.step}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#0f0f11", marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Autonomy Levels ── */}
      <section id="autonomy" style={{ background: "linear-gradient(180deg, #fafafa 0%, #fff 100%)", borderTop: "1px solid #f0f0f0", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>AGENT AUTONOMY</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0f0f11", marginBottom: 14, letterSpacing: "-0.02em" }}>
            에이전트 자율성 수준 선택
          </h2>
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 48, lineHeight: 1.7, maxWidth: 560 }}>
            얼마나 많은 제어권을 AI 에이전트에게 줄지 선택하세요.<br />
            목적에 맞는 자율성 수준으로 최적의 개발 경험을 얻으세요.
          </p>
          <div className="autonomy-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {AUTONOMY_LEVELS.map((a, i) => (
              <div
                key={i}
                onClick={() => setActiveAutonomy(a.id)}
                style={{
                  padding: "28px 22px", borderRadius: 16, cursor: "pointer", transition: "all 0.2s",
                  background: activeAutonomy === a.id ? a.bg : "#fff",
                  border: `2px solid ${activeAutonomy === a.id ? a.border : "#e5e7eb"}`,
                  boxShadow: activeAutonomy === a.id ? `0 8px 32px ${a.color}20` : "0 2px 8px rgba(0,0,0,0.04)",
                  transform: activeAutonomy === a.id ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{a.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: activeAutonomy === a.id ? a.color : "#0f0f11", marginBottom: 8 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 16 }}>{a.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {a.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: activeAutonomy === a.id ? a.color : "#9ca3af" }}>
                      <span>✓</span> {f}
                    </div>
                  ))}
                </div>
                {activeAutonomy === a.id && (
                  <div style={{ marginTop: 16, padding: "5px 10px", borderRadius: 8, background: a.color, color: "#fff", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                    선택됨
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Templates ── */}
      <Section id="examples" style={{ paddingTop: 96 }}>
        <SectionLabel>TEMPLATES</SectionLabel>
        <SectionTitle>아이디어로 시작하세요</SectionTitle>
        <SectionSub>수백 가지 템플릿 중에서 시작점을 선택하거나, 직접 설명하세요.</SectionSub>
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

      {/* ── Connectors ── */}
      <section style={{ background: "#050508", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>INTEGRATIONS</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 14, letterSpacing: "-0.02em" }}>
            40+ 서비스와 즉시 연동
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 56, lineHeight: 1.7, maxWidth: 560 }}>
            데이터베이스, 결제, AI 모델, 스토리지 — 필요한 모든 서비스를<br />
            코드 한 줄 없이 연동하세요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CONNECTORS.map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500,
                transition: "all 0.15s", cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(249,115,22,0.1)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(249,115,22,0.3)"; (e.currentTarget as HTMLDivElement).style.color = "#f97316"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.7)"; }}
              >
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: "#fff", borderTop: "1px solid #f0f0f0", padding: "96px 24px" }}>
        <Section style={{ paddingBottom: 0, paddingTop: 0 }}>
          <SectionLabel>왜 FieldNine인가</SectionLabel>
          <SectionTitle>강력함, 단순함, 빠름</SectionTitle>
          <SectionSub>복잡한 개발 없이도 엔터프라이즈급 AI 앱을 만들 수 있습니다.</SectionSub>
          <FeatureGrid>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: "24px", background: "#fff", borderRadius: 14, border: "1.5px solid #f0f0f0", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#f97316"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#f0f0f0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f0f11", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </FeatureGrid>
        </Section>
      </section>

      {/* ── vs Replit 비교표 ── */}
      <section style={{ background: "#050508", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", fontSize: 11, fontWeight: 700, color: "#f97316", marginBottom: 16, letterSpacing: "0.06em" }}>
              VS REPLIT
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              왜 FieldNine인가요?
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", margin: 0, lineHeight: 1.7 }}>
              Replit보다 강력하고, 한국어에 최적화되고, 더 저렴합니다.
            </p>
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>기능</div>
              <div style={{ padding: "14px 16px", fontSize: 13, fontWeight: 900, color: "#f97316", textAlign: "center", background: "rgba(249,115,22,0.08)" }}>FieldNine</div>
              <div style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#6b7280", textAlign: "center" }}>Replit</div>
            </div>
            {VS_REPLIT.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", borderBottom: i < VS_REPLIT.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <div style={{ padding: "13px 20px", fontSize: 13, color: "#d4d8e2" }}>{row.feature}</div>
                <div style={{ padding: "13px 16px", textAlign: "center", background: "rgba(249,115,22,0.04)" }}>
                  {typeof row.fieldnine === "boolean"
                    ? <span style={{ color: row.fieldnine ? "#22c55e" : "#ef4444", fontSize: 16 }}>{row.fieldnine ? "✓" : "✗"}</span>
                    : <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>{row.fieldnine}</span>}
                </div>
                <div style={{ padding: "13px 16px", textAlign: "center" }}>
                  {typeof row.replit === "boolean"
                    ? <span style={{ color: row.replit ? "#22c55e" : "#4b5563", fontSize: 16 }}>{row.replit ? "✓" : "✗"}</span>
                    : <span style={{ fontSize: 11, color: "#6b7280" }}>{row.replit}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={() => router.push("/signup")}
              style={{ padding: "14px 40px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}>
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </section>

      {/* ── 소셜 프루프 / 후기 ── */}
      <section style={{ background: "#fff", padding: "80px 24px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, border: "1px solid rgba(249,115,22,0.25)", background: "rgba(249,115,22,0.06)", fontSize: 11, fontWeight: 700, color: "#f97316", marginBottom: 16, letterSpacing: "0.06em" }}>
              실제 사용자 후기
            </div>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, color: "#0f0f11", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              개발자들이 선택한 이유
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
              이미 수천 명의 메이커들이 FieldNine으로 아이디어를 현실로 만들고 있습니다.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {[
              { name: "김태우", role: "스타트업 창업자", avatar: "👨‍💼", text: "기획 단계에서 프로토타입까지 30분이면 충분합니다. 투자자 미팅 전날 밤에도 데모 앱을 뚝딱 만들었어요.", rating: 5 },
              { name: "이수진", role: "프리랜서 디자이너", avatar: "👩‍🎨", text: "Claude로 한국어 최적화된 코드를 받으면 품질이 너무 달라요. Grok으로 최신 트렌드 반영한 앱도 만들 수 있고.", rating: 5 },
              { name: "박민준", role: "마케터", avatar: "🧑‍💻", text: "코딩을 전혀 모르는데 랜딩 페이지를 혼자 만들었습니다. 팀에서 저한테 개발자냐고 물어볼 정도예요.", rating: 5 },
              { name: "최유리", role: "SaaS 개발자", avatar: "👩‍💻", text: "GPT와 Claude를 번갈아 쓰면서 최적의 결과를 얻을 수 있어요. 레플릿보다 한국어 컨텍스트 이해도가 훨씬 높습니다.", rating: 5 },
              { name: "정현석", role: "인디 해커", avatar: "🧑‍🚀", text: "Grok으로 실시간 뉴스를 반영한 앱을 만들었는데 다른 AI빌더에서는 절대 불가능한 기능이에요.", rating: 5 },
              { name: "한나리", role: "제품 매니저", avatar: "👩‍🏫", text: "배포 버튼 하나로 바로 URL이 생기는 게 너무 편해요. 팀원들과 링크 공유만 하면 끝이라 피드백 루프가 엄청 빨라졌어요.", rating: 5 },
            ].map((t, i) => (
              <div key={i} style={{ padding: "24px", borderRadius: 16, background: "#fafafa", border: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ color: "#f97316", fontSize: 14, letterSpacing: 2 }}>{"★".repeat(t.rating)}</div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, margin: 0, flex: 1 }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f0f11" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, marginTop: 56, padding: "40px", borderRadius: 20, background: "linear-gradient(135deg, #fff7ed, #fff)", border: "1px solid #fed7aa" }}>
            {[
              { num: "4,200+", label: "가입 사용자" },
              { num: "18,000+", label: "생성된 앱" },
              { num: "4.9/5",  label: "평균 만족도" },
              { num: "< 30초", label: "평균 앱 생성 시간" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, color: "#f97316", letterSpacing: "-0.02em" }}>{s.num}</div>
                <div style={{ fontSize: 13, color: "#9a3412", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enterprise ── */}
      <section id="enterprise" style={{ background: "linear-gradient(135deg, #0f0f11 0%, #1a0a05 100%)", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="enterprise-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>ENTERPRISE</p>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                엔터프라이즈를 위한<br />완벽한 보안
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginBottom: 36, lineHeight: 1.7 }}>
                규모와 관계없이 가장 엄격한 보안 및 컴플라이언스 요구사항을 충족합니다. 데이터는 항상 안전합니다.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["SOC 2 Type II", "GDPR", "ISO 27001"].map(cert => (
                  <div key={cert} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.08)", fontSize: 12, fontWeight: 700, color: "#f97316" }}>
                    ✓ {cert}
                  </div>
                ))}
              </div>
              <a href="mailto:sales@fieldnine.io" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 32, padding: "12px 24px", borderRadius: 10, background: "linear-gradient(135deg, #f97316, #f43f5e)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(249,115,22,0.35)" }}>
                영업팀에 문의하기 →
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {ENTERPRISE_FEATURES.map((f, i) => (
                <div key={i} style={{ padding: "20px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(249,115,22,0.06)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(249,115,22,0.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>PRICING</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0f0f11", textAlign: "center", marginBottom: 14, letterSpacing: "-0.02em" }}>투명한 가격</h2>
          <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 56, lineHeight: 1.7 }}>
            숨겨진 비용 없이 필요한 만큼만 사용하세요.
          </p>
          <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                padding: "28px 22px", borderRadius: 18, position: "relative",
                border: plan.highlight ? "2px solid #f97316" : "1.5px solid #e5e7eb",
                background: plan.highlight ? "linear-gradient(180deg, #fff7ed 0%, #fff 40%)" : "#fff",
                boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                {plan.badge && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.highlight ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)" : "#1b1b1f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: 16, color: "#0f0f11", marginBottom: 6 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: plan.original ? 4 : 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#0f0f11", letterSpacing: "-0.02em" }}>{plan.price}</span>
                  {plan.priceDesc && <span style={{ fontSize: 12, color: "#9ca3af" }}>{plan.priceDesc}</span>}
                </div>
                {plan.original && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ textDecoration: "line-through" }}>정가 {plan.original}</span>
                    {plan.badge && <span style={{ background: "#dcfce7", color: "#16a34a", fontWeight: 700, padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>절약</span>}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {plan.features.map((feat, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: feat.ok ? "#374151" : "#c4c9d4" }}>
                      {feat.ok ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="7" cy="7" r="6.5" fill={plan.highlight ? "#f97316" : "#22c55e"}/>
                          <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="7" cy="7" r="6.5" fill="#f1f5f9"/>
                          <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#c4c9d4" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {feat.text}
                    </div>
                  ))}
                </div>
                <a href={plan.ctaHref} style={{
                  display: "block", padding: "11px 0", borderRadius: 10, textAlign: "center",
                  textDecoration: "none", fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                  background: plan.highlight ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)" : "transparent",
                  color: plan.highlight ? "#fff" : "#374151",
                  border: plan.highlight ? "none" : "1.5px solid #e5e7eb",
                  boxShadow: plan.highlight ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: "#9ca3af" }}>
            모든 플랜은 14일 무료 체험 포함 · 언제든지 취소 가능 ·{" "}
            <a href="mailto:support@fieldnine.io" style={{ color: "#f97316", textDecoration: "none" }}>문의하기</a>
          </p>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ background: "linear-gradient(135deg, #f97316 0%, #f43f5e 50%, #7c3aed 100%)", padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 14, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            지금 바로 시작하세요
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 36, lineHeight: 1.7 }}>
            신용카드 없이 무료로 시작하세요. 5분 안에 첫 번째 앱을 만들어보세요.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/signup" style={{ padding: "13px 28px", borderRadius: 12, background: "#fff", color: "#f97316", textDecoration: "none", fontSize: 15, fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
              무료로 시작하기 →
            </a>
            <a href="mailto:sales@fieldnine.io" style={{ padding: "13px 28px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700 }}>
              영업팀 문의
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer>
        <div>
          <NavLogo style={{ marginBottom: 14 }}>
            <LogoMark>F9</LogoMark>
            FieldNine
          </NavLogo>
          <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 240, lineHeight: 1.7 }}>
            AI 에이전트로 더 빠르게 만들고,<br />더 스마트하게 협업하세요.
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            {["SOC 2", "GDPR", "ISO 27001"].map(c => (
              <span key={c} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, border: "1px solid #e5e7eb", color: "#9ca3af", fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>서비스</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "/workspace", label: "워크스페이스" },
                { href: "/team",      label: "팀 협업" },
                { href: "/cloud",     label: "클라우드" },
                { href: "/cowork",    label: "코워크" },
                { href: "/pricing",   label: "요금제" },
              ].map(l => (
                <a key={l.href} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>회사</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { href: "mailto:support@fieldnine.io", label: "지원" },
                { href: "mailto:sales@fieldnine.io",   label: "영업" },
                { href: "/privacy",                    label: "개인정보처리방침" },
                { href: "/terms",                      label: "이용약관" },
              ].map(l => (
                <a key={l.label} href={l.href} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#c4c9d4", alignSelf: "flex-end" }}>
          © 2026 FieldNine Inc. All rights reserved.
        </div>
      </Footer>

      <style>{`
        * { box-sizing: border-box; }

        /* ── Mobile responsive ── */
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .how-grid > div::before { display: none; }
          .autonomy-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .enterprise-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .nav-links { display: none !important; }
          .hero-title { font-size: 34px !important; }
          .connector-section { padding: 56px 16px !important; }
          .cta-buttons { flex-direction: column !important; align-items: center !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .autonomy-grid { grid-template-columns: 1fr 1fr !important; }
        }

        /* ── How-it-works connector line hide on mobile ── */
        @media (max-width: 640px) {
          .how-connector { display: none !important; }
        }

        /* ── Smooth scroll ── */
        html { scroll-behavior: smooth; }

        /* ── Focus visible ── */
        button:focus-visible, a:focus-visible {
          outline: 2px solid #f97316;
          outline-offset: 2px;
        }
      `}</style>
    </Page>
  );
}
