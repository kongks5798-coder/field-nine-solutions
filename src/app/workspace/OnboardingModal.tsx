"use client";

import { useState } from "react";
import { T } from "./workspace.constants";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    icon: "\uD83C\uDFAF",
    title: "AI\uc5d0\uac8c \ub9d0\ud558\uae30",
    desc: "\uc67c\ucabd AI \ucc44\ud305 \ud328\ub110\uc5d0\uc11c \ub9cc\ub4e4\uace0 \uc2f6\uc740 \uc571\uc744 \uc124\uba85\ud558\uc138\uc694.\n\"\ud560 \uc77c \uad00\ub9ac \uc571 \ub9cc\ub4e4\uc5b4\uc918\"\ucc98\ub7fc \uc790\uc5f0\uc2a4\ub7fd\uac8c \uc785\ub825\ud558\uba74\nAI\uac00 HTML/CSS/JS\ub97c \uc790\ub3d9 \uc0dd\uc131\ud569\ub2c8\ub2e4.",
    highlight: "#f97316",
  },
  {
    icon: "\uD83D\uDCE6",
    title: "\ud15c\ud50c\ub9bf \uc0ac\uc6a9\ud558\uae30",
    desc: "\ud15c\ud50c\ub9bf \uac24\ub7ec\ub9ac\uc5d0\uc11c \uc6d0\ud558\ub294 \ud504\ub85c\uc81d\ud2b8 \uc720\ud615\uc744 \uc120\ud0dd\ud558\uc138\uc694.\n\ucc44\ud305\uc571, \uac8c\uc784, \ub300\uc2dc\ubcf4\ub4dc \ub4f1 \ub2e4\uc591\ud55c \ud15c\ud50c\ub9bf\uc73c\ub85c\n\ube60\ub974\uac8c \uc2dc\uc791\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
    highlight: "#60a5fa",
  },
  {
    icon: "\uD83D\uDE80",
    title: "\ubbf8\ub9ac\ubcf4\uae30 & \ubc30\ud3ec",
    desc: "\uc624\ub978\ucabd \ubbf8\ub9ac\ubcf4\uae30 \ud328\ub110\uc5d0\uc11c \uc2e4\uc2dc\uac04\uc73c\ub85c \uacb0\uacfc\ub97c \ud655\uc778\ud558\uc138\uc694.\n\ub9cc\uc871\uc2a4\ub7ec\uc6b0\uba74 \ubc30\ud3ec \ubc84\ud2bc\uc744 \ub20c\ub7ec\n\ub9c1\ud06c \ud558\ub098\ub85c \ub204\uad6c\ub4e0\uc9c0 \uc811\uadfc\ud560 \uc218 \uc788\uac8c \uacf5\uc720\ud558\uc138\uc694.",
    highlight: "#22c55e",
  },
];

export function OnboardingModal({ open, onStart, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

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
      <div style={{
        background: T.surface,
        border: `1px solid ${T.borderHi}`,
        borderRadius: 20,
        padding: "40px 36px 32px",
        width: 480,
        maxWidth: "90vw",
        boxShadow: "0 32px 80px rgba(0,0,0,0.1)",
        animation: "scaleIn 0.2s ease-out",
      }}>
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
          marginBottom: 32, whiteSpace: "pre-line",
        }}>
          {current.desc}
        </p>

        {/* Progress dots */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, marginBottom: 28,
        }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`\ub2e8\uacc4 ${i + 1}`}
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
              \uc774\uc804
            </button>
          )}
          <button
            onClick={isLast ? onStart : () => setStep(s => s + 1)}
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
            {isLast ? "\uD83D\uDE80 \uc2dc\uc791\ud558\uae30" : "\ub2e4\uc74c"}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          style={{
            width: "100%", padding: "10px",
            background: "transparent", color: T.muted,
            border: "none", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit", marginTop: 8,
          }}
        >
          \uac74\ub108\ub6f0\uae30
        </button>
      </div>
    </div>
  );
}
