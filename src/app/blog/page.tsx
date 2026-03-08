import { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "블로그 | Dalkak",
  description: "Dalkak 팀의 최신 소식, 기능 업데이트, AI 개발 팁을 확인하세요.",
  openGraph: {
    title: "Dalkak 블로그 — AI 웹앱 빌더 소식",
    description: "최신 업데이트, 튜토리얼, 케이스 스터디를 확인하세요.",
  },
};

/* ── 데이터 ─────────────────────────────────────────── */

type Category = "공지" | "튜토리얼" | "기술" | "업데이트" | "케이스 스터디";

interface BlogPost {
  id: number;
  emoji: string;
  title: string;
  date: string;
  category: Category;
  preview: string;
}

const POSTS: BlogPost[] = [
  {
    id: 1,
    emoji: "\u{1F31F}",
    title: "Dalkak V5.0 출시 — 버전 히스토리·팀·마켓플레이스",
    date: "2026-03-08",
    category: "업데이트",
    preview:
      "V5.0이 드디어 출시되었습니다. 버전 히스토리로 과거 코드를 복원하고, 팀원을 초대해 함께 앱을 만들고, 100+ 템플릿 마켓에서 바로 시작하세요.",
  },
  {
    id: 2,
    emoji: "\u{1F916}",
    title: "AI 디버깅 에이전트 — 에러를 자동으로 찾고 고쳐드립니다",
    date: "2026-03-01",
    category: "업데이트",
    preview:
      "코드에 에러가 발생하면 AI가 자동으로 원인을 분석하고 수정 방안을 제안합니다. 더 이상 스택 트레이스 앞에서 당황하지 마세요.",
  },
  {
    id: 3,
    emoji: "\u{1F4A1}",
    title: "AI로 더 좋은 웹앱 만드는 5가지 프롬프트 팁",
    date: "2026-02-25",
    category: "튜토리얼",
    preview:
      "프롬프트를 어떻게 작성하느냐에 따라 결과물의 품질이 크게 달라집니다. 구체적인 예시와 함께 상용급 앱을 만드는 실전 팁을 알아보세요.",
  },
  {
    id: 4,
    emoji: "\u{1F680}",
    title: "Dalkak 2.0 출시 — AI 워크스페이스의 새로운 시대",
    date: "2026-02-20",
    category: "업데이트",
    preview:
      "전면 리뉴얼된 Dalkak 2.0을 소개합니다. 다크 테마, PWA, 실시간 협업 등 개발자가 꿈꿔 온 모든 것이 담겨 있습니다.",
  },
  {
    id: 5,
    emoji: "\u{1F3AE}",
    title: "게임 템플릿 7종 추가 — 테트리스부터 그림판까지",
    date: "2026-02-18",
    category: "업데이트",
    preview:
      "클릭 한 번으로 시작할 수 있는 게임 템플릿 7종이 추가되었습니다. 테트리스, 스네이크, 메모리 매치 등 재미있는 프로젝트를 바로 만들어 보세요.",
  },
  {
    id: 6,
    emoji: "\u{1F512}",
    title: "보안 업데이트 — CSRF, Rate Limiting, RBAC",
    date: "2026-02-15",
    category: "기술",
    preview:
      "Dalkak의 보안 아키텍처를 한 단계 끌어올렸습니다. CSRF 토큰, API Rate Limiting, 역할 기반 접근 제어(RBAC)를 전면 도입했습니다.",
  },
  {
    id: 7,
    emoji: "\u{1F4CA}",
    title: "LM Playground — GPT·Claude·Gemini·Grok 한눈에 비교",
    date: "2026-02-10",
    category: "기술",
    preview:
      "GPT-4o, Claude 3.7, Gemini 2.0, Grok 3를 나란히 놓고 비교하세요. LM 허브에서 파라미터를 조절하며 프로젝트에 맞는 최적의 AI 모델을 찾을 수 있습니다.",
  },
  {
    id: 8,
    emoji: "\u{1F30F}",
    title: "Dalkak이 Replit보다 나은 5가지 이유",
    date: "2026-02-08",
    category: "공지",
    preview:
      "한국어 최적화, AI 에이전트, 실시간 협업, 합리적인 요금제, 그리고 속도. Dalkak만의 차별점 5가지를 정리했습니다.",
  },
];

const CATEGORIES: Category[] = ["공지", "튜토리얼", "기술", "업데이트", "케이스 스터디"];

const CATEGORY_COLORS: Record<Category, string> = {
  공지: "#f97316",
  튜토리얼: "#3b82f6",
  기술: "#8b5cf6",
  업데이트: "#10b981",
  "케이스 스터디": "#f59e0b",
};

/* ── 페이지 ──────────────────────────────────────────── */

export default function BlogPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: 48 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1b1b1f",
              marginBottom: 8,
              letterSpacing: "-0.5px",
            }}
          >
            Dalkak 블로그
          </h1>
          <p style={{ fontSize: 17, color: "#6b7280", fontWeight: 500 }}>
            최신 소식과 튜토리얼
          </p>
        </section>

        {/* Content: sidebar + grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 32,
          }}
        >
          {/* Sidebar */}
          <aside>
            <div
              style={{
                position: "sticky",
                top: 80,
                background: "#f9fafb",
                borderRadius: 12,
                padding: "20px 16px",
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 12,
                }}
              >
                카테고리
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 6 }}>
                  <a
                    href="/blog"
                    style={{
                      display: "block",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#f97316",
                      background: "#fff7ed",
                      textDecoration: "none",
                    }}
                  >
                    전체 ({POSTS.length})
                  </a>
                </li>
                {CATEGORIES.map((cat) => {
                  const count = POSTS.filter((p) => p.category === cat).length;
                  return (
                    <li key={cat} style={{ marginBottom: 4 }}>
                      <a
                        href={`/blog?category=${encodeURIComponent(cat)}`}
                        style={{
                          display: "block",
                          padding: "8px 12px",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#374151",
                          textDecoration: "none",
                          transition: "background 0.15s",
                        }}
                      >
                        {cat} ({count})
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Post Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}
          >
            {POSTS.map((post) => (
              <article
                key={post.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
              >
                {/* Top row: emoji + category + date */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{post.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      background: CATEGORY_COLORS[post.category],
                      padding: "3px 10px",
                      borderRadius: 20,
                      textTransform: "uppercase",
                    }}
                  >
                    {post.category}
                  </span>
                  <time
                    dateTime={post.date}
                    style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}
                  >
                    {post.date}
                  </time>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1b1b1f",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {post.title}
                </h3>

                {/* Preview */}
                <p
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    lineHeight: 1.6,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {post.preview}
                </p>

                {/* Read more */}
                <a
                  href={`/blog/${post.id}`}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f97316",
                    textDecoration: "none",
                    marginTop: "auto",
                  }}
                >
                  읽기 →
                </a>
              </article>
            ))}
          </div>
        </div>

        {/* Responsive: collapse sidebar on mobile via CSS */}
        <style>{`
          @media (max-width: 768px) {
            /* Sidebar + grid wrapper */
            div[style*="grid-template-columns: 200px 1fr"] {
              grid-template-columns: 1fr !important;
            }
            /* Post grid: single column */
            div[style*="grid-template-columns: repeat(2, 1fr)"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
