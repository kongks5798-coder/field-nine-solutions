"use client";

import { useState } from "react";

interface OnboardingWelcomeModalProps {
  onClose: () => void;
  onSelectExample: (prompt: string) => void;
}

const EXAMPLES = [
  { emoji: "🎮", label: "스네이크 게임", prompt: "스네이크 게임 만들어줘" },
  { emoji: "📊", label: "가계부", prompt: "가계부 앱 만들어줘. 수입·지출 입력, 월별 통계 포함" },
  { emoji: "⏱️", label: "포모도로", prompt: "포모도로 타이머 앱 만들어줘" },
];

const STEPS = [
  {
    step: 1,
    badge: "👋",
    title: "딸깍에 오신 걸 환영해요!",
    desc: "한국어로 말하면 앱이 만들어집니다",
    sub: "복잡한 코드 없이, 아이디어를 바로 앱으로.",
    cta: "다음 →",
  },
  {
    step: 2,
    badge: "✦",
    title: "이렇게 시작해요",
    desc: "입력창에 만들고 싶은 앱을 설명하세요",
    sub: "예: \"카페 메뉴판 앱 만들어줘\"",
    cta: "직접 해보기 →",
  },
  {
    step: 3,
    badge: "🚀",
    title: "첫 앱을 만들어볼까요?",
    desc: "아래 예시 중 하나를 골라보세요",
    sub: null,
    cta: null,
  },
];

const TOTAL = STEPS.length;

export function OnboardingWelcomeModal({ onClose, onSelectExample }: OnboardingWelcomeModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === TOTAL - 1;

  function handleCta() {
    if (isLast) return;
    if (step === TOTAL - 2) {
      // 스텝 2 "직접 해보기" → 모달 닫기
      onClose();
      return;
    }
    setStep(s => s + 1);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "36px 32px 28px",
          width: 480,
          maxWidth: "92vw",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          position: "relative",
          animation: "wm-in 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes wm-in {
            from { opacity: 0; transform: scale(0.94) translateY(10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>

        {/* 진행 점 (dots) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? "#f97316" : "rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        {/* 배지 아이콘 */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(249,115,22,0.12)",
          border: "1px solid rgba(249,115,22,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 18,
        }}>
          {current.badge}
        </div>

        {/* 스텝 카운터 */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#f97316",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          STEP {current.step} / {TOTAL}
        </div>

        {/* 제목 */}
        <h2
          id="welcome-modal-title"
          style={{
            fontSize: 21,
            fontWeight: 900,
            color: "#f0f4f8",
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          {current.title}
        </h2>

        {/* 설명 */}
        <p style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 14,
          lineHeight: 1.7,
          margin: "0 0 6px",
        }}>
          {current.desc}
        </p>

        {current.sub && (
          <p style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            lineHeight: 1.6,
            margin: "0 0 28px",
            fontStyle: "italic",
          }}>
            {current.sub}
          </p>
        )}

        {/* 스텝 3: 예시 버튼 */}
        {isLast && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, marginTop: 20 }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                onClick={() => onSelectExample(ex.prompt)}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  background: "rgba(249,115,22,0.07)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#f0f4f8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "center",
                  transition: "border-color 0.18s, background 0.18s",
                  lineHeight: 1.4,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)";
                  e.currentTarget.style.background = "rgba(249,115,22,0.14)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(249,115,22,0.07)";
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{ex.emoji}</div>
                <div>{ex.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* CTA 버튼 (스텝 1, 2) */}
        {!isLast && (
          <button
            onClick={handleCta}
            style={{
              width: "100%",
              padding: "13px",
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: current.sub ? 0 : 24,
              boxShadow: "0 4px 20px rgba(249,115,22,0.3)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            {current.cta}
          </button>
        )}

        {/* 이전 버튼 (스텝 2 이상) */}
        {step > 0 && !isLast && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              width: "100%",
              padding: "9px",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              border: "none",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: 8,
            }}
          >
            이전
          </button>
        )}

        {/* 건너뛰기 (스텝 1) */}
        {step === 0 && (
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "9px",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              border: "none",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: 8,
            }}
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
