"use client";

/**
 * CollabBar — thin status strip that shows who is in the collaboration session.
 *
 * Placement: add to the toolbar / status-bar area in WorkspaceEditorPane or page.tsx.
 *
 * When inactive → renders a single "협업" button.
 * When active   → shows colored avatar circles for each peer, a "연결됨" badge,
 *                 a "링크 복사" button, and a "종료" button.
 */

import React, { useCallback } from "react";
import type { CollabUser } from "./useCollaboration";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollabBarProps {
  /** Whether a collaboration session is currently active */
  isActive: boolean;
  /** Whether the WebRTC transport is connected */
  isConnected: boolean;
  /** List of peers currently in the session */
  peers: CollabUser[];
  /** Current room ID (used for the invite link) */
  roomId: string;
  /** Called when the user clicks "협업" (start) or "종료" (stop) */
  onToggle: () => void;
  /** Optional: show toast messages */
  onToast?: (msg: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PeerAvatar({ user }: { user: CollabUser }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      title={user.name}
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: user.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        border: "2px solid rgba(0,0,0,0.25)",
        letterSpacing: 0.3,
        cursor: "default",
        userSelect: "none",
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── CollabBar ────────────────────────────────────────────────────────────────

export function CollabBar({
  isActive,
  isConnected,
  peers,
  roomId,
  onToggle,
  onToast,
}: CollabBarProps) {
  const handleCopyLink = useCallback(() => {
    if (!roomId) return;
    const url = `${window.location.origin}/workspace?collab=${encodeURIComponent(roomId)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => onToast?.("링크 복사됨"))
      .catch(() => onToast?.("클립보드 접근 실패"));
  }, [roomId, onToast]);

  // ── Inactive state ────────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        title="실시간 협업 시작"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 6,
          color: "#a78bfa",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(139,92,246,0.22)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(139,92,246,0.12)")
        }
      >
        {/* People icon */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="5" r="2.5" />
          <path d="M1 13c0-2.761 2.239-5 5-5" />
          <circle cx="11" cy="5" r="2.5" />
          <path d="M10 8c2.761 0 5 2.239 5 5" />
        </svg>
        협업
      </button>
    );
  }

  // ── Active state ──────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        background: isConnected
          ? "rgba(34,197,94,0.08)"
          : "rgba(245,158,11,0.08)",
        border: `1px solid ${isConnected ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
        borderRadius: 6,
        flexShrink: 0,
      }}
    >
      {/* Live indicator dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isConnected ? "#22c55e" : "#f59e0b",
          flexShrink: 0,
        }}
      />

      {/* Status label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: isConnected ? "#22c55e" : "#f59e0b",
          letterSpacing: 0.4,
          whiteSpace: "nowrap",
        }}
      >
        {isConnected ? "연결됨" : "연결 중…"}
      </span>

      {/* Peer avatars (up to 5, then +N) */}
      {peers.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: -4 }}>
          {peers.slice(0, 5).map((peer) => (
            <PeerAvatar key={peer.clientId} user={peer} />
          ))}
          {peers.length > 5 && (
            <span
              style={{
                fontSize: 9,
                color: "#9ca3af",
                marginLeft: 4,
                fontWeight: 600,
              }}
            >
              +{peers.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Copy link button */}
      <button
        onClick={handleCopyLink}
        title="초대 링크 복사"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 7px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4,
          color: "#9ca3af",
          fontSize: 10,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2H14V6" />
          <path d="M14 2L7 9" />
          <path d="M12 9V14H2V4H7" />
        </svg>
        링크
      </button>

      {/* Stop button */}
      <button
        onClick={onToggle}
        title="협업 종료"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "2px 7px",
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: 4,
          color: "#f87171",
          fontSize: 10,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        종료
      </button>
    </div>
  );
}
