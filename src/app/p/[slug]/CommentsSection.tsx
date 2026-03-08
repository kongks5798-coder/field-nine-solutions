"use client";

import { useState, useEffect, useCallback } from "react";

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

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/published/${encodeURIComponent(slug)}/comments`
      );
      const data = await res.json();
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
          body: JSON.stringify({ content: text }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "댓글 작성 실패");
      } else {
        setText("");
        // Prepend the new comment optimistically
        if (data.comment) {
          setComments((prev) => [
            {
              ...data.comment,
              profiles: null,
            },
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

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingTop: 20,
        marginTop: 20,
      }}
    >
      <h3
        style={{
          color: "#d4d8e2",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        💬 댓글{" "}
        {comments.length > 0 && (
          <span
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "1px 8px",
              fontSize: 12,
              fontWeight: 600,
              color: "#8b949e",
            }}
          >
            {comments.length}
          </span>
        )}
      </h3>

      {/* Comment input */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 남겨보세요 (로그인 필요)"
            maxLength={500}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#d4d8e2",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background:
                submitting || !text.trim()
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg,#f97316,#f43f5e)",
              color: submitting || !text.trim() ? "#4b5563" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: submitting || !text.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {submitting ? "전송 중…" : "댓글 달기"}
          </button>
        </div>
        {error && (
          <p style={{ color: "#f43f5e", fontSize: 12, marginTop: 6 }}>
            {error}
          </p>
        )}
      </form>

      {/* Comments list */}
      {loading ? (
        <p style={{ color: "#4b5563", fontSize: 13 }}>댓글 로딩 중…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "#4b5563", fontSize: 13 }}>
          아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {comments.map((c) => (
            <li
              key={c.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#f97316,#f43f5e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (c.profiles?.full_name?.[0] ?? "?").toUpperCase()
                )}
              </div>

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
                  <span style={{ color: "#4b5563", fontSize: 11 }}>
                    {getRelativeTime(c.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: 13,
                    margin: 0,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}
                >
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
