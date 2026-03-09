"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import BookmarkButton from "@/components/BookmarkButton";
import Link from "next/link";

interface Bookmark {
  app_slug: string;
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then(r => r.json())
      .then(d => {
        if (d.bookmarks) setBookmarks(d.bookmarks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div style={{
        minHeight: "100vh",
        background: "#010409",
        color: "#d4d8e2",
        fontFamily: "'Inter', 'Pretendard', sans-serif",
        padding: "40px 24px",
        maxWidth: 800,
        margin: "0 auto",
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>내 북마크</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 32 }}>저장한 앱 목록</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a5066" }}>불러오는 중...</div>
        ) : bookmarks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
            <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 8 }}>저장한 앱이 없어요</div>
            <div style={{ fontSize: 13, color: "#4a5066", marginBottom: 24 }}>쇼케이스에서 마음에 드는 앱을 북마크해보세요</div>
            <a href="/showcase" style={{ color: "#f97316", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
              쇼케이스 보기 →
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {bookmarks.map(b => (
              <div
                key={b.app_slug}
                style={{
                  background: "#0d1117",
                  border: "1px solid #21262d",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <Link
                    href={`/p/${b.app_slug}`}
                    style={{ color: "#d4d8e2", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
                  >
                    {b.app_slug}
                  </Link>
                  <div style={{ fontSize: 12, color: "#4a5066", marginTop: 4 }}>
                    {new Date(b.created_at).toLocaleDateString("ko-KR")} 저장
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <BookmarkButton slug={b.app_slug} initialBookmarked={true} />
                  <a
                    href={`/p/${b.app_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#f97316", fontSize: 12, fontWeight: 600,
                      textDecoration: "none", padding: "5px 12px",
                      border: "1px solid rgba(249,115,22,0.25)",
                      borderRadius: 8, background: "rgba(249,115,22,0.06)",
                    }}
                  >
                    열기 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
