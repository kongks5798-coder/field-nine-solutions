"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}달 전`;
}

function getInitial(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim()[0]?.toUpperCase() ?? "?";
}

const AVATAR_COLORS = [
  "#f97316",
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#f43f5e",
  "#a855f7",
  "#14b8a6",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect auth session client-side
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/published/${encodeURIComponent(slug)}/comments`
      );
      const data = (await res.json()) as { comments?: Comment[] };
      setComments(data.comments ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/published/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        }
      );
      const data = (await res.json()) as {
        comment?: Comment;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "댓글 작성 실패");
      } else {
        setText("");
        if (data.comment) {
          setComments((prev) => [
            { ...data.comment!, profiles: null },
            ...prev,
          ]);
        }
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      const res = await fetch(
        `/api/published/${encodeURIComponent(slug)}/comments?id=${encodeURIComponent(commentId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  const MAX = 500;
  const remaining = MAX - text.length;

  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 28,
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Section title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            color: "#f0f4f8",
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
          }}
        >
          댓글
        </h3>
        {comments.length > 0 && (
          <span
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "1px 9px",
              fontSize: 12,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment input / login gate */}
      {currentUserId === null ? (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#94a3b8", fontSize: 13 }}>
            로그인하면 댓글을 남길 수 있어요
          </span>
          <a
            href="/login"
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              background: "linear-gradient(135deg,#f97316,#f43f5e)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            로그인
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color 0.15s",
            }}
            onFocus={() => {
              const el = textareaRef.current?.parentElement?.parentElement;
              if (el) el.style.borderColor = "rgba(249,115,22,0.35)";
            }}
            onBlur={() => {
              const el = textareaRef.current?.parentElement?.parentElement;
              if (el) el.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            <textarea
              ref={textareaRef}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="댓글을 남겨보세요…"
              maxLength={MAX}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "12px 14px 6px",
                color: "#f0f4f8",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 14px 10px",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: remaining < 50 ? "#f43f5e" : "#475569",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {text.length}/{MAX}
              </span>
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                style={{
                  padding: "6px 18px",
                  borderRadius: 8,
                  background:
                    submitting || !text.trim()
                      ? "rgba(255,255,255,0.07)"
                      : "#0a0a0a",
                  color:
                    submitting || !text.trim() ? "#475569" : "#f0f4f8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    submitting || !text.trim() ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  border:
                    submitting || !text.trim()
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(255,255,255,0.15)",
                  transition: "all 0.15s",
                }}
              >
                {submitting ? "전송 중…" : "등록"}
              </button>
            </div>
          </div>
          {error && (
            <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 6 }}>
              {error}
            </p>
          )}
        </form>
      )}

      {/* Comments list */}
      {loading ? (
        <p style={{ color: "#475569", fontSize: 13 }}>댓글 로딩 중…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
          첫 댓글을 남겨보세요! 👋
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {comments.map((c) => {
            const isOwn = c.user_id === currentUserId;
            const isHovered = hoveredId === c.id;
            const isDeleting = deletingId === c.id;

            return (
              <li
                key={c.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  position: "relative",
                }}
                onMouseEnter={() => setHoveredId(c.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.profiles?.avatar_url
                      ? "transparent"
                      : avatarColor(c.user_id),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {c.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.profiles.avatar_url}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    getInitial(c.profiles?.full_name)
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        color: "#c9d1d9",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {c.profiles?.full_name ?? "익명"}
                    </span>
                    <span style={{ color: "#475569", fontSize: 11 }}>
                      {getRelativeTime(c.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: 13,
                      margin: 0,
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                      opacity: isDeleting ? 0.4 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {c.content}
                  </p>
                </div>

                {/* Delete button (own comments only, show on hover) */}
                {isOwn && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={isDeleting}
                    aria-label="댓글 삭제"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(15,15,20,0.9)",
                      color: "#8b949e",
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isHovered && !isDeleting ? 1 : 0,
                      transition: "opacity 0.15s",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
