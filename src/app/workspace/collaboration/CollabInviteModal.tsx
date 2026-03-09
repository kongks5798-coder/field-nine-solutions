"use client";

/**
 * CollabInviteModal — shown when a user initiates a collaboration session.
 *
 * Flow:
 *   1. User enters display name (defaults to localStorage or "익명 사용자").
 *   2. A room ID is auto-generated (or pre-filled from URL ?collab= param).
 *   3. The invite link is shown for easy copying.
 *   4. On "협업 시작" → calls onStart(roomId, username).
 *   5. On "취소" or backdrop click → calls onClose().
 *
 * Dark theme to match the workspace IDE aesthetic.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { generateRoomId } from "../collab/CollabProvider";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollabInviteModalProps {
  /** Called with the chosen roomId and username when the user confirms */
  onStart: (roomId: string, username: string) => void;
  /** Called when the modal is dismissed without starting */
  onClose: () => void;
  /**
   * If provided the modal will pre-fill the room ID field.
   * Useful when the page was opened with ?collab=<roomId>.
   */
  initialRoomId?: string;
}

// ─── Token colors (IDE dark theme) ───────────────────────────────────────────

const C = {
  bg: "#1a1a2e",
  surface: "#16213e",
  border: "#2a2a4a",
  borderHi: "#3a3a6a",
  text: "#e2e8f0",
  muted: "#64748b",
  accent: "#7c3aed",
  accentHover: "#6d28d9",
  green: "#22c55e",
  red: "#ef4444",
} as const;

// ─── Local storage key ────────────────────────────────────────────────────────

const LS_NAME_KEY = "f9_collab_name";

// ─── Component ────────────────────────────────────────────────────────────────

export function CollabInviteModal({
  onStart,
  onClose,
  initialRoomId,
}: CollabInviteModalProps) {
  const [roomId, setRoomId] = useState<string>(() => initialRoomId || generateRoomId());
  const [username, setUsername] = useState<string>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(LS_NAME_KEY) || "익명 사용자";
    }
    return "익명 사용자";
  });
  const [copied, setCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus username field on open
  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/workspace?collab=${encodeURIComponent(roomId)}`
      : `/workspace?collab=${encodeURIComponent(roomId)}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard may not be available (http)
    }
  }, [inviteLink]);

  const handleStart = useCallback(() => {
    const name = username.trim() || "익명 사용자";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LS_NAME_KEY, name);
    }
    onStart(roomId, name);
  }, [roomId, username, onStart]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleStart();
      if (e.key === "Escape") onClose();
    },
    [handleStart, onClose],
  );

  const handleNewRoomId = useCallback(() => {
    setRoomId(generateRoomId());
  }, []);

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="협업 세션 시작"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Modal panel */}
      <div
        style={{
          width: 400,
          maxWidth: "calc(100vw - 32px)",
          background: C.bg,
          border: `1px solid ${C.borderHi}`,
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Collaboration icon */}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(124,58,237,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke={C.accent}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="5" r="2.5" />
                <path d="M1 13c0-2.761 2.239-5 5-5" />
                <circle cx="11" cy="5" r="2.5" />
                <path d="M10 8c2.761 0 5 2.239 5 5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                실시간 협업 시작
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                P2P WebRTC · 서버 불필요
              </div>
            </div>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "transparent",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              lineHeight: 1,
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div style={{ padding: "20px" }}>
          {/* Display name */}
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 6,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            표시 이름
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="익명 사용자"
            maxLength={40}
            style={{
              width: "100%",
              padding: "9px 12px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />

          {/* Room ID */}
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 6,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            방 ID
          </label>
          <div
            style={{ display: "flex", gap: 6, marginBottom: 16 }}
          >
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="방 ID 입력 또는 생성"
              style={{
                flex: 1,
                padding: "9px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontSize: 12,
                fontFamily: '"JetBrains Mono","Fira Code",monospace',
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
            <button
              onClick={handleNewRoomId}
              title="새 방 ID 생성"
              style={{
                padding: "9px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.muted,
                cursor: "pointer",
                fontSize: 15,
                lineHeight: 1,
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              🎲
            </button>
          </div>

          {/* Invite link */}
          <div
            style={{
              padding: "10px 12px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 11,
                color: C.muted,
                fontFamily: '"JetBrains Mono","Fira Code",monospace',
                wordBreak: "break-all",
                lineHeight: 1.5,
              }}
            >
              {inviteLink}
            </div>
            <button
              onClick={handleCopyLink}
              title="링크 복사"
              style={{
                flexShrink: 0,
                padding: "5px 10px",
                background: copied
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : C.border}`,
                borderRadius: 6,
                color: copied ? C.green : C.muted,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "✓ 복사됨" : "복사"}
            </button>
          </div>

          {/* Info box */}
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.2)",
              borderRadius: 8,
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            WebRTC P2P 연결로 서버를 거치지 않습니다.{" "}
            <strong style={{ color: C.text }}>방 ID</strong> 또는{" "}
            <strong style={{ color: C.text }}>초대 링크</strong>를 팀원과
            공유하세요.
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                color: C.muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = C.borderHi)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = C.border)
              }
            >
              취소
            </button>
            <button
              onClick={handleStart}
              style={{
                flex: 2,
                padding: "10px 16px",
                background: `linear-gradient(135deg, ${C.accent}, #9333ea)`,
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                transition: "transform 0.1s, box-shadow 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(124,58,237,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(124,58,237,0.4)";
              }}
            >
              협업 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
