"use client";

import { useState, useEffect } from "react";
import { T } from "./workspace.constants";
import { track } from "@/lib/analytics";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
  onSelectTemplate?: (prompt: string) => void;
}

const STEPS = [
  {
    icon: "\uD83C\uDFAF",
    title: "AI에게 말하기",
    desc: "왼쪽 AI 채팅 패널에서 만들고 싶은 앱을 설명하세요.\n\"할 일 관리 앱 만들어줘\"처럼 자연스럽게 입력하면\nAI가 HTML/CSS/JS를 자동 생성합니다.",
    highlight: "#f97316",
  },
  {
    icon: "\uD83D\uDCE6",
    title: "템플릿 사용하기",
    desc: "템플릿 갤러리에서 원하는 프로젝트 유형을 선택하세요.\n채팅앱, 게임, 대시보드 등 다양한 템플릿으로\n빠르게 시작할 수 있습니다.",
    highlight: "#f97316",
  },
  {
    icon: "\uD83D\uDE80",
    title: "미리보기 & 배포",
    desc: "오른쪽 미리보기 패널에서 실시간으로 결과를 확인하세요.\n만족스러우면 배포 버튼을 눌러\n링크 하나로 누구든지 접근할 수 있게 공유하세요.",
    highlight: "#f97316",
  },
];

const TEMPLATES = [
  { emoji: "\uD83C\uDFAE", name: "RPG 게임", prompt: "마을을 탐험하고 몬스터를 잡는 간단한 RPG 게임 만들어줘" },
  { emoji: "\uD83D\uDED2", name: "쇼핑몰", prompt: "예쁜 패션 쇼핑몰 만들어줘" },
  { emoji: "\uD83D\uDCCA", name: "대시보드", prompt: "매출 분석 대시보드 만들어줘" },
  { emoji: "\uD83D\uDEB5", name: "배달앱", prompt: "배달의민족 스타일 음식 배달 앱 만들어줘" },
  { emoji: "\uD83D\uDC3E", name: "반려동물", prompt: "반려동물 케어 다이어리 앱 만들어줘" },
  { emoji: "\uD83C\uDFCB\uFE0F", name: "헬스 기록", prompt: "헬스 운동 기록 앱 만들어줘. 운동 타이머, 루틴, 주간 통계 포함" },
];

// ── A/B Test variant assignment ───────────────────────────────────────────────
// Variant A: 3-step tutorial (original)
// Variant B: 1-step direct "just type" with example cards
function getAbVariant(): "A" | "B" {
  if (typeof window === "undefined") return "A";
  const stored = localStorage.getItem("onboarding_ab_variant");
  if (stored === "A" || stored === "B") return stored;
  const variant: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
  localStorage.setItem("onboarding_ab_variant", variant);
  return variant;
}

// ── Variant B: Direct prompt UI ────────────────────────────────────────────────
const QUICK_STARTS = [
  { emoji: "🎮", label: "RPG 게임", prompt: "마을을 탐험하고 몬스터를 잡는 간단한 RPG 게임 만들어줘" },
  { emoji: "🛒", label: "쇼핑몰", prompt: "예쁜 패션 쇼핑몰 만들어줘" },
  { emoji: "📊", label: "대시보드", prompt: "매출 분석 대시보드 만들어줘" },
  { emoji: "⏱", label: "타이머", prompt: "포모도로 타이머 앱 만들어줘" },
  { emoji: "📝", label: "할 일", prompt: "드래그 가능한 칸반 보드 할 일 관리 앱 만들어줘" },
  { emoji: "🎵", label: "음악 플레이어", prompt: "애니메이션이 있는 음악 플레이어 UI 만들어줘" },
];

function OnboardingVariantB({ onSelectTemplate, onSkip }: { onSelectTemplate?: (p: string) => void; onSkip: () => void }) {
  function handleSelect(prompt: string) {
    track("onboarding_variant_b_template_selected", { prompt: prompt.slice(0, 40) });
    if (onSelectTemplate) onSelectTemplate(prompt);
    else onSkip();
  }

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.borderHi}`,
      borderRadius: 20,
      padding: "36px 32px 28px",
      width: 520,
      maxWidth: "90vw",
      boxShadow: "0 32px 80px rgba(0,0,0,0.1)",
      animation: "scaleIn 0.2s ease-out",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>딸깍</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          무엇을 만들어볼까요?
        </h2>
        <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
          아이디어를 선택하거나 직접 입력하세요 — AI가 즉시 만들어줍니다
        </p>
      </div>

      {/* Quick start grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        {QUICK_STARTS.map(q => (
          <button
            key={q.label}
            onClick={() => handleSelect(q.prompt)}
            style={{
              background: "rgba(249,115,22,0.06)",
              border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "14px 8px", cursor: "pointer",
              color: T.text, fontSize: 12, textAlign: "center",
              transition: "border-color 0.2s, background 0.2s, transform 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#f97316";
              e.currentTarget.style.background = "rgba(249,115,22,0.12)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.background = "rgba(249,115,22,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{q.emoji}</div>
            <div style={{ fontWeight: 700 }}>{q.label}</div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => { track("onboarding_variant_b_blank_start", {}); onSkip(); }}
        style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          color: "#fff", border: "none",
          borderRadius: 10, fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
          marginBottom: 10,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        ✏️ 직접 입력하기
      </button>
      <button
        onClick={() => { track("onboarding_variant_b_skipped", {}); onSkip(); }}
        style={{
          width: "100%", padding: "10px",
          background: "transparent", color: T.muted,
          border: "none", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        건너뛰기
      </button>
    </div>
  );
}

export function OnboardingModal({ open, onStart, onSkip, onSelectTemplate }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [abVariant, setAbVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    if (!open) return;
    const variant = getAbVariant();
    setAbVariant(variant);
    track("onboarding_shown", { variant });
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleTemplate = (prompt: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(prompt);
    } else {
      onStart();
    }
  };

  // Track variant A completion
  const handleVariantAStart = () => {
    track("onboarding_completed", { variant: "A" });
    onStart();
  };
  const handleVariantATemplate = (prompt: string) => {
    track("onboarding_variant_a_template_selected", { prompt: prompt.slice(0, 40) });
    handleTemplate(prompt);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 600,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Variant B: direct action-first UI */}
      {abVariant === "B" && (
        <OnboardingVariantB onSelectTemplate={onSelectTemplate} onSkip={onSkip} />
      )}
      {/* Variant A: 3-step tutorial (original) */}
      {abVariant === "A" && <div style={{
        background: T.surface,
        border: `1px solid ${T.borderHi}`,
        borderRadius: 20,
        padding: "40px 36px 32px",
        width: 520,
        maxWidth: "90vw",
        boxShadow: "0 32px 80px rgba(0,0,0,0.1)",
        animation: "scaleIn 0.2s ease-out",
      }}>
        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? current.highlight : "#e5e7eb",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Step icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: `${current.highlight}18`,
          border: `1px solid ${current.highlight}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, marginBottom: 20,
        }} aria-hidden="true">
          {current.icon}
        </div>

        {/* Step counter */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: current.highlight,
          letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 8,
        }}>
          STEP {step + 1} / {STEPS.length}
        </div>

        {/* Title */}
        <h2 id="onboarding-title" style={{
          fontSize: 22, fontWeight: 900, color: T.text,
          margin: "0 0 12px", letterSpacing: "-0.01em",
        }}>
          {current.title}
        </h2>

        {/* Description */}
        <p style={{
          color: T.muted, fontSize: 14, lineHeight: 1.8,
          marginBottom: isLast ? 20 : 32, whiteSpace: "pre-line",
        }}>
          {current.desc}
        </p>

        {/* Templates (last step only) */}
        {isLast && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ color: T.muted, fontSize: 12, fontWeight: 600, margin: 0 }}>
                템플릿으로 빠르게 시작하기
              </p>
              <span style={{ fontSize: 10, color: current.highlight, fontWeight: 700, padding: "2px 8px", borderRadius: 8, background: `${current.highlight}12`, border: `1px solid ${current.highlight}30` }}>
                💡 / 슬래시로 명령어 입력 가능
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleVariantATemplate(t.prompt)}
                  style={{
                    background: `${current.highlight}08`,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "12px 8px", cursor: "pointer",
                    color: T.text, fontSize: 12, textAlign: "center",
                    transition: "border-color 0.2s, background 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = current.highlight;
                    e.currentTarget.style.background = `${current.highlight}15`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.background = `${current.highlight}08`;
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginBottom: 28,
        }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`단계 ${i + 1}`}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: "none",
                background: i === step ? current.highlight : "#e5e7eb",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
                minWidth: 0,
                minHeight: 0,
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: "13px",
                background: "#f3f4f6",
                color: T.muted,
                border: `1px solid ${T.border}`,
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              이전
            </button>
          )}
          <button
            onClick={isLast ? handleVariantAStart : () => setStep(s => s + 1)}
            style={{
              flex: 2, padding: "13px",
              background: isLast
                ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)"
                : current.highlight,
              color: "#fff",
              border: "none",
              borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.12s",
              boxShadow: isLast ? "0 4px 20px rgba(249,115,22,0.3)" : "none",
            }}
          >
            {isLast ? "\uD83D\uDE80 시작하기" : "다음"}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={() => { track("onboarding_skipped", { variant: "A" }); onSkip(); }}
          style={{
            width: "100%", padding: "10px",
            background: "transparent", color: T.muted,
            border: "none", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit", marginTop: 8,
          }}
        >
          건너뛰기
        </button>
      </div>}
    </div>
  );
}
