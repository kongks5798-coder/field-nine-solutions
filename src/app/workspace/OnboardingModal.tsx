"use client";

import { T } from "./workspace.constants";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

const STEPS = [
  { icon: "💬", title: "1. AI에게 요청", desc: "\"할 일 관리 앱 만들어줘\"처럼 말하세요" },
  { icon: "⚡", title: "2. 자동 생성", desc: "AI가 HTML/CSS/JS를 즉시 작성합니다" },
  { icon: "👁️", title: "3. 미리보기", desc: "오른쪽에서 실시간으로 확인하세요" },
  { icon: "🚀", title: "4. 배포 공유", desc: "링크 하나로 누구든지 접근 가능" },
];

export function OnboardingModal({ open, onStart, onSkip }: OnboardingModalProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
    >
      <div style={{ background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 20, padding: "36px 32px", width: 520, boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">👋</div>
        <h2 id="onboarding-title" style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: "0 0 8px" }}>
          Dalkak에 오신 것을 환영합니다!
        </h2>
        <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          AI로 웹 앱을 몇 초 만에 만드세요.<br />코딩 지식이 없어도 됩니다.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {STEPS.map(step => (
            <div key={step.title} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px" }}>
              <div style={{ fontSize: 20, marginBottom: 6 }} aria-hidden="true">{step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: `${T.accent}18`, border: `1px solid ${T.borderHi}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: T.muted }}>
          💡 <strong style={{ color: T.text }}>팁:</strong> 왼쪽 채팅창에 원하는 앱을 입력하면 바로 시작됩니다. 스타터 플랜은 하루 10회 무료!
        </div>
        <button
          onClick={onStart}
          style={{ width: "100%", padding: "14px", background: T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
        >
          🚀 첫 번째 앱 만들기
        </button>
        <button
          onClick={onSkip}
          style={{ width: "100%", padding: "10px", background: "transparent", color: T.muted, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          직접 시작하기
        </button>
      </div>
    </div>
  );
}
