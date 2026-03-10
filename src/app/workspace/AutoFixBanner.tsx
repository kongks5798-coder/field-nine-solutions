"use client";

/**
 * AutoFixBanner — 프리뷰 iframe 위에 오버레이로 표시되는 AI 자동 수정 배너
 *
 * 에러 감지 시 하단에 배너가 나타나며:
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

export function AutoFixBanner({ autoFixErrors, onCancelCountdown }: AutoFixBannerProps) {
  const errorCount = usePreviewStore(s => s.errorCount);
  const logs = usePreviewStore(s => s.logs);

  const autoFixCountdown = useAiStore(s => s.autoFixCountdown);
  const autoFixMode = useAiStore(s => s.autoFixMode);
  const setAutoFixMode = useAiStore(s => s.setAutoFixMode);
  const aiLoading = useAiStore(s => s.aiLoading);

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
    // 자동수정 끄면 카운트다운도 취소
    if (!next) {
      onCancelCountdown();
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelCountdown();
  };

  const isCountingDown = autoFixCountdown !== null && autoFixCountdown > 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        background: "linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(239,68,68,0.12) 100%)",
        backdropFilter: "blur(6px)",
        borderTop: `1px solid rgba(239,68,68,0.25)`,
        fontSize: 11,
        fontFamily: "inherit",
      }}
    >
      {/* 에러 아이콘 + 카운트 */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: T.red,
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
        JS 에러 {errorCount}건
      </span>

      {/* 카운트다운 또는 상태 메시지 */}
      {autoFixMode && (
        <span style={{ color: "#94a3b8", fontSize: 10, flexShrink: 0 }}>
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
            border: `1px solid rgba(148,163,184,0.2)`,
            background: "transparent",
            color: "#94a3b8",
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
          border: `1px solid ${autoFixMode ? `${T.accent}50` : "rgba(148,163,184,0.2)"}`,
          background: autoFixMode ? `${T.accent}15` : "transparent",
          color: autoFixMode ? T.accent : "#94a3b8",
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
          transition: "all 0.15s",
          letterSpacing: "0.3px",
        }}
      >
        자동 {autoFixMode ? "ON" : "OFF"}
      </button>
    </div>
  );
}
