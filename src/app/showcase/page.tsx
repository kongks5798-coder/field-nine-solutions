import AppShell from "@/components/AppShell";

export const metadata = {
  title: "쇼케이스 — Dalkak",
  description: "Dalkak으로 만든 프로젝트들",
};

/* ── 데이터 ─────────────────────────────────────────── */

type FilterTag = "전체" | "게임" | "앱" | "도구" | "웹사이트";

interface ShowcaseItem {
  id: number;
  emoji: string;
  name: string;
  author: string;
  views: string;
  likes: number;
  tag: Exclude<FilterTag, "전체">;
}

const PROJECTS: ShowcaseItem[] = [
  { id: 1, emoji: "\u{1F3AE}", name: "네온 테트리스",       author: "@gamer_kim",   views: "2.3K", likes: 182, tag: "게임" },
  { id: 2, emoji: "\u{1F4CA}", name: "실시간 대시보드",     author: "@data_park",   views: "1.8K", likes: 134, tag: "도구" },
  { id: 3, emoji: "\u{1F6CD}\uFE0F", name: "미니 쇼핑몰",        author: "@dev_lee",     views: "3.1K", likes: 267, tag: "웹사이트" },
  { id: 4, emoji: "\u{1F3A8}", name: "포트폴리오 v3",       author: "@design_choi", views: "4.2K", likes: 389, tag: "웹사이트" },
  { id: 5, emoji: "\u{1F4DD}", name: "AI 블로그 생성기",    author: "@ai_jung",     views: "1.5K", likes: 98,  tag: "도구" },
  { id: 6, emoji: "\u{1F522}", name: "수학 퀴즈 앱",        author: "@edu_song",    views: "890",  likes: 56,  tag: "앱" },
  { id: 7, emoji: "\u{1F326}\uFE0F", name: "날씨 위젯",          author: "@weather_han", views: "2.1K", likes: 145, tag: "앱" },
  { id: 8, emoji: "\u{1F4AC}", name: "AI 챗봇",             author: "@bot_yoon",    views: "5.6K", likes: 472, tag: "도구" },
];

const FILTERS: FilterTag[] = ["전체", "게임", "앱", "도구", "웹사이트"];

const TAG_COLORS: Record<string, string> = {
  게임: "#f43f5e",
  앱: "#3b82f6",
  도구: "#8b5cf6",
  웹사이트: "#10b981",
};

/* ── 페이지 ──────────────────────────────────────────── */

export default function ShowcasePage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1b1b1f",
              marginBottom: 8,
              letterSpacing: "-0.5px",
            }}
          >
            딸깍으로 만든 작품들
          </h1>
          <p style={{ fontSize: 17, color: "#6b7280", fontWeight: 500 }}>
            전 세계 개발자들의 창작물
          </p>
        </section>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 36,
            flexWrap: "wrap",
          }}
        >
          {FILTERS.map((f) => {
            const isAll = f === "전체";
            return (
              <a
                key={f}
                href={isAll ? "/showcase" : `/showcase?tag=${encodeURIComponent(f)}`}
                style={{
                  padding: "7px 18px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: isAll ? "#fff" : "#374151",
                  background: isAll ? "#f97316" : "#f3f4f6",
                  border: isAll ? "none" : "1px solid #e5e7eb",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </a>
            );
          })}
        </div>

        {/* Project Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {PROJECTS.map((proj) => (
            <article
              key={proj.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
            >
              {/* Emoji thumbnail */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/10",
                  background: "#f9fafb",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                }}
              >
                {proj.emoji}
              </div>

              {/* Tag badge */}
              <span
                style={{
                  alignSelf: "flex-start",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  background: TAG_COLORS[proj.tag] ?? "#6b7280",
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {proj.tag}
              </span>

              {/* Name */}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1b1b1f", margin: 0 }}>
                {proj.name}
              </h3>

              {/* Author */}
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{proj.author}</span>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                <span>👁 {proj.views}</span>
                <span>❤️ {proj.likes}</span>
              </div>

              {/* CTA */}
              <a
                href={`/showcase/${proj.id}`}
                style={{
                  marginTop: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "9px 0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f97316",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                구경하기 →
              </a>
            </article>
          ))}
        </div>

        {/* Responsive */}
        <style>{`
          @media (max-width: 1024px) {
            div[style*="grid-template-columns: repeat(4, 1fr)"] {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 600px) {
            div[style*="grid-template-columns: repeat(4, 1fr)"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
