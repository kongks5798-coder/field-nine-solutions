"use client";

import React, { useState } from "react";
import { styled, globalStyles } from "@/lib/stitches.config";
import { AIMode } from "@/lib/ai/multiAI";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled("div", {
  minHeight: "100vh", background: "#fff", color: "#1b1b1f",
  fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
});

// Nav
const Nav = styled("nav", {
  display: "flex", alignItems: "center", padding: "0 32px", height: 60,
  borderBottom: "1px solid #e5e7eb", background: "#fff", position: "sticky",
  top: 0, zIndex: 100,
});
const NavLogo = styled("div", {
  display: "flex", alignItems: "center", gap: 8, fontWeight: 800,
  fontSize: 18, color: "#1b1b1f", cursor: "pointer", marginRight: 32,
});
const LogoMark = styled("div", {
  width: 32, height: 32, borderRadius: 8,
  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontWeight: 900, fontSize: 14, color: "#fff",
});
const NavLinks = styled("div", {
  display: "flex", alignItems: "center", gap: 4, flex: 1,
});
const NavLink = styled("a", {
  padding: "6px 12px", borderRadius: 6, fontSize: 14, color: "#374151",
  textDecoration: "none", fontWeight: 500, cursor: "pointer",
  "&:hover": { background: "#f3f4f6", color: "#111" },
});
const NavRight = styled("div", {
  display: "flex", alignItems: "center", gap: 8,
});
const NavBtn = styled("a", {
  padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
  textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
  variants: {
    variant: {
      ghost: { color: "#374151", background: "transparent", "&:hover": { background: "#f3f4f6" } },
      primary: { color: "#fff", background: "#f97316", "&:hover": { background: "#ea6c0a" } },
    },
  },
});

// Hero
const Hero = styled("div", {
  display: "flex", flexDirection: "column", alignItems: "center",
  paddingTop: 80, paddingBottom: 60, paddingLeft: 24, paddingRight: 24,
});
const HeroTitle = styled("h1", {
  fontSize: 52, fontWeight: 900, color: "#1b1b1f", textAlign: "center",
  lineHeight: 1.15, marginBottom: 8, letterSpacing: "-0.02em",
  "@media (max-width: 640px)": { fontSize: 34 },
});
const HeroSub = styled("p", {
  fontSize: 18, color: "#6b7280", textAlign: "center", marginBottom: 40, fontWeight: 400,
});

// Prompt Card
const PromptCard = styled("div", {
  width: "100%", maxWidth: 720, background: "#fff",
  border: "1.5px solid #e5e7eb", borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden",
});
const PromptTabs = styled("div", {
  display: "flex", borderBottom: "1px solid #f3f4f6", padding: "0 4px",
});
const PromptTab = styled("button", {
  display: "flex", alignItems: "center", gap: 6, padding: "12px 18px",
  background: "none", border: "none", fontSize: 14, fontWeight: 600,
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
  fontFamily: "inherit", lineHeight: 1.6,
  "&::placeholder": { color: "#9ca3af" },
});
const PromptBottom = styled("div", {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "12px 20px",
});
const PromptActions = styled("div", { display: "flex", alignItems: "center", gap: 8 });
const AttachBtn = styled("button", {
  padding: "6px 8px", borderRadius: 6, border: "none", background: "none",
  color: "#9ca3af", cursor: "pointer", fontSize: 18,
  "&:hover": { background: "#f3f4f6", color: "#374151" },
});
const AIModelPill = styled("select", {
  padding: "5px 10px", borderRadius: 20, border: "1px solid #e5e7eb",
  fontSize: 12, fontWeight: 600, color: "#374151", background: "#f9fafb",
  cursor: "pointer", outline: "none",
  "&:hover": { borderColor: "#d1d5db" },
});
const StartBtn = styled("button", {
  display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
  borderRadius: 8, border: "none", background: "#f97316", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
  "&:hover": { background: "#ea6c0a", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" },
  "&:disabled": { background: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed", transform: "none", boxShadow: "none" },
});

// Section
const Section = styled("section", {
  maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px",
});
const SectionTitle = styled("h2", {
  fontSize: 22, fontWeight: 800, color: "#1b1b1f", marginBottom: 20,
});
const CategoryPills = styled("div", {
  display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap",
});
const Pill = styled("button", {
  padding: "7px 16px", borderRadius: 20, border: "1.5px solid #e5e7eb",
  fontSize: 13, fontWeight: 600, background: "#fff", color: "#374151",
  cursor: "pointer", transition: "all 0.15s",
  "&:hover": { borderColor: "#f97316", color: "#f97316" },
  variants: {
    active: { true: { borderColor: "#f97316", color: "#f97316", background: "#fff7ed" } },
  },
});
const CardGrid = styled("div", {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16,
});
const TemplateCard = styled("div", {
  border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
  cursor: "pointer", transition: "all 0.18s", background: "#fff",
  "&:hover": { borderColor: "#f97316", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
});
const CardThumb = styled("div", {
  height: 130, display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 40, borderBottom: "1px solid #f3f4f6",
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
const CardBody = styled("div", { padding: "14px 14px 16px" });
const CardTitle = styled("div", { fontWeight: 700, fontSize: 14, color: "#1b1b1f", marginBottom: 4 });
const CardDesc = styled("div", { fontSize: 12, color: "#6b7280", lineHeight: 1.5 });

// Footer
const Footer = styled("footer", {
  borderTop: "1px solid #e5e7eb", background: "#f9fafb",
  padding: "32px 32px", display: "flex", justifyContent: "space-between",
  alignItems: "center", flexWrap: "wrap", gap: 16,
});
const FooterLinks = styled("div", { display: "flex", gap: 20, flexWrap: "wrap" });
const FooterLink = styled("a", {
  fontSize: 13, color: "#6b7280", textDecoration: "none",
  "&:hover": { color: "#1b1b1f" },
});

// ─── Data ─────────────────────────────────────────────────────────────────────

type Category = "AI 앱" | "웹사이트" | "비즈니스" | "개인 소프트웨어";

const TEMPLATES: Record<Category, { icon: string; color: "orange" | "blue" | "purple" | "green" | "pink" | "gray"; title: string; desc: string; prompt: string }[]> = {
  "AI 앱": [
    { icon: "🤖", color: "orange", title: "AI 챗봇", desc: "커스텀 AI 어시스턴트를 몇 분 만에 만들어보세요", prompt: "OpenAI API를 활용한 한국어 AI 챗봇 앱을 만들어줘" },
    { icon: "🧠", color: "purple", title: "AI 코드 리뷰어", desc: "코드를 붙여넣으면 AI가 리뷰해주는 앱", prompt: "코드를 입력하면 AI가 리뷰해주고 개선점을 알려주는 앱 만들어줘" },
    { icon: "📝", color: "blue", title: "AI 문서 요약기", desc: "긴 문서를 AI가 핵심만 요약해줘요", prompt: "문서를 업로드하면 AI가 요약해주는 앱을 만들어줘" },
    { icon: "🎨", color: "pink", title: "AI 이미지 생성기", desc: "텍스트로 이미지를 만드는 AI 앱", prompt: "DALL-E API로 텍스트를 이미지로 변환하는 앱 만들어줘" },
  ],
  "웹사이트": [
    { icon: "🏪", color: "orange", title: "쇼핑몰", desc: "상품 진열부터 결제까지 완성형 쇼핑몰", prompt: "모바일 친화적인 한국어 쇼핑몰 웹사이트 만들어줘" },
    { icon: "📰", color: "blue", title: "뉴스 블로그", desc: "깔끔한 뉴스/블로그 사이트", prompt: "SEO 최적화된 한국어 뉴스 블로그 웹사이트 만들어줘" },
    { icon: "💼", color: "gray", title: "포트폴리오", desc: "나만의 개발자 포트폴리오 사이트", prompt: "세련된 개발자 포트폴리오 웹사이트 만들어줘" },
    { icon: "🏠", color: "green", title: "랜딩 페이지", desc: "전환율 높은 SaaS 랜딩 페이지", prompt: "전환율 최적화된 SaaS 서비스 한국어 랜딩 페이지 만들어줘" },
  ],
  "비즈니스": [
    { icon: "📊", color: "blue", title: "대시보드", desc: "실시간 데이터를 시각화하는 관리자 대시보드", prompt: "실시간 차트와 통계가 있는 비즈니스 대시보드 만들어줘" },
    { icon: "👥", color: "purple", title: "CRM 시스템", desc: "고객 관리를 한 곳에서 처리하는 CRM", prompt: "고객 정보 관리, 상담 이력 추적 기능이 있는 CRM 만들어줘" },
    { icon: "📅", color: "orange", title: "예약 시스템", desc: "온라인 예약을 받을 수 있는 시스템", prompt: "캘린더 기반의 온라인 예약 시스템 만들어줘" },
    { icon: "📦", color: "green", title: "재고 관리", desc: "입출고, 재고 현황 관리 시스템", prompt: "바코드 스캔, 입출고 관리, 재고 현황 조회가 되는 시스템 만들어줘" },
  ],
  "개인 소프트웨어": [
    { icon: "✅", color: "green", title: "할 일 관리", desc: "습관 추적 기능까지 갖춘 스마트 할일 앱", prompt: "습관 추적, 우선순위 설정이 되는 스마트 할일 앱 만들어줘" },
    { icon: "💰", color: "orange", title: "가계부", desc: "수입/지출을 분석해주는 개인 가계부", prompt: "카테고리별 지출 분석, 월별 리포트 기능이 있는 가계부 앱 만들어줘" },
    { icon: "📚", color: "blue", title: "독서 기록", desc: "읽은 책을 기록하고 리뷰하는 앱", prompt: "독서 목록, 리뷰, 읽기 진행률을 관리하는 독서 기록 앱 만들어줘" },
    { icon: "🏃", color: "pink", title: "운동 트래커", desc: "운동 루틴을 기록하고 분석해요", prompt: "운동 루틴 설정, 기록, 진행 그래프가 있는 운동 트래커 만들어줘" },
  ],
};

const CATEGORIES: Category[] = ["AI 앱", "웹사이트", "비즈니스", "개인 소프트웨어"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  globalStyles();

  const [promptTab, setPromptTab] = useState<"app" | "design">("app");
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("openai");
  const [category, setCategory] = useState<Category>("AI 앱");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleStart = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}\n\n(한국어로 답변해줘, 구체적으로)`, mode: aiMode }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let started = false;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text } = JSON.parse(line.slice(6));
                setResult(r => (started ? r : "") + text);
                started = true;
              } catch {}
            }
          }
        }
      }
    } catch {
      setResult("AI 연결 오류. /settings에서 API 키를 확인하거나, /signup으로 가입 후 워크스페이스에서 설정해주세요.");
    }
    setLoading(false);
  };

  const handleTemplate = (tmpl: { prompt: string }) => {
    setPrompt(tmpl.prompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Page>
      {/* ── Nav ── */}
      <Nav>
        <NavLogo>
          <LogoMark>F9</LogoMark>
          FieldNine
        </NavLogo>
        <NavLinks>
          <NavLink href="#">제품 Products</NavLink>
          <NavLink href="#">기업 For Work</NavLink>
          <NavLink href="#">리소스 Resources</NavLink>
          <NavLink href="#">요금제 Pricing</NavLink>
          <NavLink href="#">채용 Careers</NavLink>
        </NavLinks>
        <NavRight>
          <NavBtn variant="ghost" href="/workspace">내 워크스페이스</NavBtn>
          <NavBtn variant="ghost" href="/login">로그인 Log in</NavBtn>
          <NavBtn variant="primary" href="/signup">시작하기 →</NavBtn>
        </NavRight>
      </Nav>

      {/* ── Hero ── */}
      <Hero>
        <HeroTitle>무엇을 만들어드릴까요?</HeroTitle>
        <HeroSub>아이디어를 입력하면 AI가 즉시 만들어줍니다 — What will you build?</HeroSub>

        <PromptCard>
          <PromptTabs>
            <PromptTab active={promptTab === "app"} onClick={() => setPromptTab("app")}>
              ⚡ 앱 App
            </PromptTab>
            <PromptTab active={promptTab === "design"} onClick={() => setPromptTab("design")}>
              🎨 디자인 Design
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
            <PromptActions>
              <AttachBtn title="파일 첨부">📎</AttachBtn>
              <AIModelPill value={aiMode} onChange={e => setAiMode(e.target.value as AIMode)}>
                <option value="openai">🤖 GPT-3.5</option>
                <option value="anthropic">🟣 Claude 3</option>
                <option value="gemini">✨ Gemini</option>
              </AIModelPill>
            </PromptActions>
            <StartBtn onClick={handleStart} disabled={loading || !prompt.trim()}>
              {loading ? "생성 중..." : "시작하기 Start →"}
            </StartBtn>
          </PromptBottom>
        </PromptCard>

        {/* AI Result */}
        {result && (
          <div style={{
            width: "100%", maxWidth: 720, marginTop: 16, padding: "20px 24px",
            background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 12,
            fontSize: 14, lineHeight: 1.75, color: "#1b1b1f", whiteSpace: "pre-wrap",
          }}>
            <div style={{ fontWeight: 700, color: "#f97316", marginBottom: 8, fontSize: 13 }}>
              🤖 FieldNine AI 응답
            </div>
            {result}
          </div>
        )}
      </Hero>

      {/* ── Templates ── */}
      <Section>
        <SectionTitle>아이디어로 시작하세요 — Start with an idea</SectionTitle>
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

      {/* ── Footer ── */}
      <Footer>
        <NavLogo style={{ fontSize: 15 }}>
          <LogoMark>F9</LogoMark>
          FieldNine Studio
        </NavLogo>
        <FooterLinks>
          <FooterLink href="/signup">무료 가입</FooterLink>
          <FooterLink href="/login">로그인</FooterLink>
          <FooterLink href="/workspace">워크스페이스</FooterLink>
          <FooterLink href="/team">팀 협업</FooterLink>
          <FooterLink href="/cloud">클라우드</FooterLink>
          <FooterLink href="/admin/login">어드민</FooterLink>
          <FooterLink href="#">개인정보처리방침</FooterLink>
          <FooterLink href="#">이용약관</FooterLink>
        </FooterLinks>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          © 2026 FieldNine. All rights reserved.
        </div>
      </Footer>
    </Page>
  );
}
