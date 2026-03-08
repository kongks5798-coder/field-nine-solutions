"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────── */
interface FaqItem {
  q: string;
  a: string;
}

interface Section {
  id: string;
  emoji: string;
  title: string;
  faqs: FaqItem[];
}

/* ── Data ──────────────────────────────────────────────── */
const SECTIONS: Section[] = [
  {
    id: "getting-started",
    emoji: "🚀",
    title: "시작하기",
    faqs: [
      {
        q: "Dalkak은 어떻게 사용하나요?",
        a: "회원가입 후 워크스페이스에서 AI 채팅창에 만들고 싶은 앱을 설명하면 됩니다. 예: '투두리스트 앱을 만들어줘' → AI가 HTML, CSS, JavaScript를 즉시 생성하고 미리보기를 보여줍니다.",
      },
      {
        q: "무료로 사용할 수 있나요?",
        a: "네! 무료 플랜으로 매월 50회의 AI 생성을 사용할 수 있습니다. 더 많은 생성 횟수와 고급 기능이 필요하다면 프로(₩39,000/월) 또는 팀 플랜(₩99,000/월)을 이용하세요.",
      },
      {
        q: "첫 앱은 어떻게 만드나요?",
        a: "1) 워크스페이스로 이동 → 2) 채팅창에 원하는 앱 설명 입력 → 3) AI가 코드를 생성하면 오른쪽 미리보기 확인 → 4) 수정이 필요하면 추가로 지시 → 5) 완성되면 '배포하기'로 URL 공유. 5분이면 첫 앱 완성!",
      },
      {
        q: "어떤 종류의 앱을 만들 수 있나요?",
        a: "웹 기반 앱이라면 무엇이든 가능합니다. 게임(RPG, 퍼즐, 슈팅), 업무 도구(투두리스트, 캘린더, 대시보드), 쇼핑몰, 포트폴리오, 계산기, 퀴즈 앱 등. 템플릿 마켓에서 100+ 예시를 참고하세요.",
      },
    ],
  },
  {
    id: "ai-prompts",
    emoji: "✍️",
    title: "AI 프롬프트 작성법",
    faqs: [
      {
        q: "좋은 프롬프트는 어떻게 작성하나요?",
        a: "구체적으로 설명할수록 좋습니다. 좋은 예: '다크 테마의 투두리스트 앱. 할일 추가/삭제/완료 체크 기능. 로컬스토리지로 데이터 저장. 모바일 반응형.' — 나쁜 예: '투두리스트 만들어줘'",
      },
      {
        q: "AI가 원하는 대로 만들지 않으면 어떻게 하나요?",
        a: "후속 지시를 통해 수정하세요. '버튼 색상을 파란색으로 바꿔줘', '폰트 크기를 키워줘', '삭제 확인 모달을 추가해줘' 처럼 구체적으로 요청하면 됩니다. 여러 번 대화하며 완성도를 높일 수 있습니다.",
      },
      {
        q: "프롬프트에 어떤 내용을 포함해야 하나요?",
        a: "① 앱 종류 ② 주요 기능 목록 ③ 디자인 스타일 (다크/라이트, 색상 테마) ④ 특별 요구사항 (반응형, 애니메이션, 데이터 저장 방식). 이 4가지를 포함하면 첫 생성 결과의 품질이 크게 향상됩니다.",
      },
      {
        q: "어떤 AI 모델을 사용해야 하나요?",
        a: "GPT-4o: 일반적인 앱 개발에 최적. Claude 3.7: 복잡한 로직, 긴 코드 작성에 강점. Gemini 2.0: 멀티미디어 관련 앱. Grok 3: 실험적 기능 탐색. LM 허브에서 모델을 비교해보세요.",
      },
    ],
  },
  {
    id: "plans",
    emoji: "💳",
    title: "플랜 & 요금",
    faqs: [
      {
        q: "무료 vs 프로 플랜 차이는 무엇인가요?",
        a: "무료: 월 50회 AI 생성, 기본 템플릿 10종, 공개 프로젝트만 지원. 프로(₩39,000/월): 무제한 AI 생성, 100+ 템플릿, 비공개 프로젝트, 커스텀 도메인, 우선 지원. 팀(₩99,000/월): 프로 기능 + 팀원 초대 5명, 공유 프로젝트, 팀 대시보드.",
      },
      {
        q: "결제는 어떻게 하나요?",
        a: "신용카드(Visa, Mastercard), 카카오페이, 토스페이를 지원합니다. 결제 → 청구 페이지에서 플랜 변경 및 카드 관리가 가능합니다. 매월 자동 갱신되며 언제든지 해지할 수 있습니다.",
      },
      {
        q: "해지하면 데이터는 어떻게 되나요?",
        a: "해지 후 30일간 프로젝트 데이터가 보존됩니다. 이 기간 내에 재구독하면 모든 데이터가 복원됩니다. 30일 이후에는 무료 플랜 한도 내 프로젝트만 유지되고 나머지는 삭제됩니다.",
      },
      {
        q: "환불은 가능한가요?",
        a: "결제 후 7일 이내에 사용 횟수가 10회 미만이라면 전액 환불이 가능합니다. 환불 신청은 contact@dalkak.io로 이메일 주시거나 청구 페이지에서 문의하세요.",
      },
    ],
  },
  {
    id: "technical",
    emoji: "⚙️",
    title: "기술 & 기능",
    faqs: [
      {
        q: "만든 앱을 어떻게 배포하나요?",
        a: "워크스페이스 상단의 '배포하기' 버튼을 클릭하면 dalkak.app/your-project 형식의 고유 URL이 생성됩니다. 프로 플랜은 커스텀 도메인(example.com)도 연결 가능합니다.",
      },
      {
        q: "생성된 코드를 직접 편집할 수 있나요?",
        a: "네! 워크스페이스의 파일 탐색기에서 HTML, CSS, JS 파일을 직접 편집할 수 있습니다. AI 생성 후 세부 조정이 필요할 때 유용합니다. 편집 중에도 미리보기가 실시간으로 반영됩니다.",
      },
      {
        q: "버전 히스토리 기능이 있나요?",
        a: "V5.0부터 버전 히스토리 기능이 추가되었습니다. 워크스페이스 상단의 '히스토리' 버튼으로 이전 버전의 스냅샷을 확인하고 복원할 수 있습니다. 프로 플랜은 무제한, 무료 플랜은 최근 5개 버전을 유지합니다.",
      },
      {
        q: "팀원과 함께 작업할 수 있나요?",
        a: "팀 플랜에서 팀원을 초대하고 역할(관리자/편집자/뷰어)을 부여할 수 있습니다. 공유 프로젝트에서 실시간으로 함께 편집하고 AI 채팅을 공유할 수 있습니다.",
      },
      {
        q: "모바일에서도 사용 가능한가요?",
        a: "네! V4.0부터 모바일 최적화가 완료되었습니다. 스마트폰에서도 AI 채팅으로 앱을 만들고 터치 UI로 편집할 수 있습니다. PWA로 설치하면 앱처럼 사용할 수 있습니다.",
      },
      {
        q: "API를 통해 Dalkak 기능을 사용할 수 있나요?",
        a: "네! Dalkak API를 제공합니다. 자세한 내용은 /docs (API 문서)를 참고하세요. API 키는 설정 → API 관리에서 발급받을 수 있습니다. 프로 플랜 이상에서 사용 가능합니다.",
      },
    ],
  },
];

/* ── Accordion Item ────────────────────────────────────── */
function AccordionItem({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        boxShadow: open ? "0 2px 12px rgba(249,115,22,0.08)" : "none",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          background: open ? "#fff7ed" : "#fff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontSize: 15,
          fontWeight: 600,
          color: open ? "#f97316" : "#1b1b1f",
          fontFamily: "inherit",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        <span>{faq.q}</span>
        <span
          style={{
            flexShrink: 0,
            fontSize: 18,
            color: open ? "#f97316" : "#9ca3af",
            transform: open ? "rotate(45deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 20px 16px",
            fontSize: 14,
            color: "#4b5563",
            lineHeight: 1.7,
            background: "#fff",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <p style={{ margin: "12px 0 0" }}>{faq.a}</p>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#1b1b1f",
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          padding: "0 24px",
          height: 56,
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 24,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 800,
            fontSize: 17,
            color: "#1b1b1f",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 13,
              color: "#fff",
            }}
          >
            D
          </div>
          Dalkak
        </Link>
        <Link
          href="/blog"
          style={{ color: "#6b7280", textDecoration: "none", fontSize: 14 }}
        >
          블로그
        </Link>
        <Link
          href="/changelog"
          style={{ color: "#6b7280", textDecoration: "none", fontSize: 14 }}
        >
          변경 이력
        </Link>
        <Link
          href="/announcements"
          style={{ color: "#6b7280", textDecoration: "none", fontSize: 14 }}
        >
          공지사항
        </Link>
        <Link
          href="/workspace"
          style={{
            marginLeft: "auto",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          앱 만들기 →
        </Link>
      </nav>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #fef3f2 100%)",
          padding: "48px 24px 40px",
          textAlign: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 8,
            letterSpacing: "-0.5px",
          }}
        >
          도움말 센터
        </h1>
        <p style={{ fontSize: 17, color: "#6b7280", margin: "0 0 24px" }}>
          Dalkak 사용에 관한 모든 것을 알아보세요
        </p>
        {/* Quick links */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: "1px solid",
                borderColor:
                  activeSection === s.id ? "#f97316" : "#e5e7eb",
                background: activeSection === s.id ? "#fff7ed" : "#fff",
                color: activeSection === s.id ? "#f97316" : "#6b7280",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {s.emoji} {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 76 }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: "1px solid #f3f4f6",
                    background: isActive ? "#fff7ed" : "#fff",
                    color: isActive ? "#f97316" : "#374151",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Contact box */}
          <div
            style={{
              marginTop: 16,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px" }}>
              답변을 못 찾으셨나요?
            </p>
            <a
              href="mailto:contact@dalkak.io"
              style={{
                display: "block",
                padding: "8px 0",
                borderRadius: 8,
                background: "#f97316",
                color: "#fff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              문의하기
            </a>
          </div>
        </aside>

        {/* FAQ Section */}
        <div>
          {SECTIONS.filter((s) => s.id === activeSection).map((section) => (
            <div key={section.id}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>{section.emoji}</span>
                <span>{section.title}</span>
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {section.faqs.map((faq, i) => (
                  <AccordionItem key={i} faq={faq} />
                ))}
              </div>
            </div>
          ))}

          {/* All-sections view (show all when none specifically selected) */}
          <div
            style={{
              marginTop: 40,
              padding: 24,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ fontSize: 40 }}>📧</div>
            <div>
              <h3
                style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}
              >
                추가 문의가 있으신가요?
              </h3>
              <p
                style={{ margin: "0 0 12px", fontSize: 14, color: "#6b7280" }}
              >
                운영팀이 평일 9-18시 (한국시간) 응답합니다. 평균 응답 시간 2시간.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href="mailto:contact@dalkak.io"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    background: "#f97316",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  이메일 문의
                </a>
                <Link
                  href="/docs"
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  API 문서
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 200px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          aside[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
