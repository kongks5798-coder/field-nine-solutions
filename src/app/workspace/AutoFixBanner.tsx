"use client";

/**
 * AutoFixBanner — 프리뷰 iframe 위에 오버레이로 표시되는 AI 자동 수정 배너
 *
 * 에러 감지 시 하단에 배너가 나타나며:
 *   - 에러 분류 메시지 + 원본 에러 첫 100자 (확장 시)
 *   - 카운트다운 표시 (autoFixMode=true 일 때)
 *   - "지금 수정" 버튼 (즉시 실행)
 *   - "자동수정 ON/OFF" 토글
 */

import React from "react";
import { usePreviewStore, useAiStore } from "./stores";
import { T } from "./workspace.constants";

interface AutoFixBannerProps {
  autoFixErrors: () => void;
  /** 카운트다운 타이머를 외부에서 취소하는 콜백 */
  onCancelCountdown: () => void;
}

/** 에러 메시지를 사용자 친화적 카테고리로 분류 */
function classifyError(msg: string): string {
  if (msg.includes("is not defined")) return "변수/함수가 정의되지 않았어요";
  if (msg.includes("Cannot read prop")) return "null/undefined 접근 오류예요";
  if (msg.includes("SyntaxError")) return "문법 오류가 있어요";
  if (msg.includes("fetch") || msg.includes("CORS")) return "API 요청 오류예요";
  if (msg.includes("addEventListener")) return "이벤트 리스너 오류예요";
  return "JavaScript 오류가 감지됐어요";
}

export function AutoFixBanner({ autoFixErrors, onCancelCountdown }: AutoFixBannerProps) {
  const errorCount = usePreviewStore(s => s.errorCount);
  const logs = usePreviewStore(s => s.logs);

  const autoFixCountdown = useAiStore(s => s.autoFixCountdown);
  const autoFixMode = useAiStore(s => s.autoFixMode);
  const setAutoFixMode = useAiStore(s => s.setAutoFixMode);
  const aiLoading = useAiStore(s => s.aiLoading);

  const [expanded, setExpanded] = React.useState(false);

  // 수정 가능한 에러가 있는지 확인
  const hasFixableError = React.useMemo(
    () =>
      logs.some(
        l =>
          l.level === "error" &&
          /SyntaxError|TypeError|ReferenceError|Unexpected token|Unexpected identifier|Unexpected number|missing \)|missing ;|is not defined|Cannot read/i.test(
            l.msg
          )
      ),
    [logs]
  );

  // 첫 번째 에러 메시지 (표시용)
  const firstError = React.useMemo(
    () => logs.find(l => l.level === "error"),
    [logs]
  );

  const errorCategory = React.useMemo(
    () => (firstError ? classifyError(firstError.msg) : "JavaScript 오류가 감지됐어요"),
    [firstError]
  );

  const errorSnippet = firstError
    ? firstError.msg.slice(0, 100) + (firstError.msg.length > 100 ? "…" : "")
    : "";

  if (errorCount === 0 || !hasFixableError) return null;

  const handleFixNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelCountdown();
    autoFixErrors();
  };

  const handleToggleAutoFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !autoFixMode;
    setAutoFixMode(next);
    if (!next) {
      onCancelCountdown();
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelCountdown();
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(v => !v);
  };

  const isCountingDown = autoFixCountdown !== null && autoFixCountdown > 0;

  return (
    <div
      onClick={handleToggleExpand}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        padding: expanded ? "10px 12px 10px 15px" : "0 12px 0 15px",
        background: "#faf8f5",
        borderTop: "3px solid #dc2626",
        borderLeft: "none",
        fontSize: 11,
        fontFamily: "inherit",
        color: "#111",
        cursor: "pointer",
        transition: "padding 0.15s ease",
        minHeight: expanded ? 80 : 44,
        justifyContent: "center",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 24,
        }}
      >
        {/* 에러 아이콘 + 카테고리 */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "#dc2626",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 1L11 10H1L6 1z" />
            <path d="M6 5v2.5M6 8.5v.5" />
          </svg>
          {errorCount}건
        </span>

        <span style={{ color: "#374151", fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
          {errorCategory}
        </span>

        {/* 카운트다운 또는 상태 메시지 */}
        {autoFixMode && (
          <span style={{ color: "#6b7280", fontSize: 10, flexShrink: 0 }}>
            {isCountingDown ? (
              <>
                <span style={{ color: T.accent, fontWeight: 700 }}>{autoFixCountdown}s</span>
                {" "}후 자동수정
              </>
            ) : aiLoading ? (
              <span style={{ color: T.accent }}>수정 중...</span>
            ) : (
              "자동수정 대기"
            )}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* 카운트다운 취소 버튼 (카운트다운 중일 때만) */}
        {isCountingDown && (
          <button
            onClick={handleCancel}
            style={{
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "transparent",
              color: "#6b7280",
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            취소
          </button>
        )}

        {/* 지금 수정 버튼 */}
        <button
          onClick={handleFixNow}
          disabled={aiLoading}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            border: "none",
            background: aiLoading
              ? "rgba(249,115,22,0.3)"
              : `linear-gradient(135deg, ${T.accent}, ${T.accentB ?? "#ea580c"})`,
            color: "#fff",
            cursor: aiLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: aiLoading ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {"\u2726"} {aiLoading ? "수정 중..." : "AI로 수정"}
        </button>

        {/* 자동수정 ON/OFF 토글 */}
        <button
          onClick={handleToggleAutoFix}
          title={autoFixMode ? "자동수정 비활성화" : "자동수정 활성화"}
          style={{
            padding: "3px 8px",
            borderRadius: 5,
            fontSize: 9,
            fontWeight: 700,
            border: `1px solid ${autoFixMode ? `${T.accent}60` : "rgba(0,0,0,0.15)"}`,
            background: autoFixMode ? `${T.accent}15` : "transparent",
            color: autoFixMode ? T.accent : "#6b7280",
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
            transition: "all 0.15s",
            letterSpacing: "0.3px",
          }}
        >
          자동 {autoFixMode ? "ON" : "OFF"}
        </button>

        {/* 펼치기/접기 화살표 */}
        <span
          style={{
            color: "#9ca3af",
            fontSize: 10,
            flexShrink: 0,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
            lineHeight: 1,
          }}
        >
          ▲
        </span>
      </div>

      {/* 확장 시: 에러 스니펫 */}
      {expanded && errorSnippet && (
        <div
          style={{
            marginTop: 8,
            padding: "5px 8px",
            background: "#f3f4f6",
            borderRadius: 4,
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: 11,
            color: "#6b7280",
            lineHeight: 1.5,
            wordBreak: "break-all",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {errorSnippet}
        </div>
      )}
    </div>
  );
}
