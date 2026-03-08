"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

// ── Types ──────────────────────────────────────────────────────────────────
interface Template {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  prompt: string;
  preview_gradient: string;
  stars: number;
  forks: number;
  views: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",           label: "전체" },
  { id: "game",          label: "게임" },
  { id: "ecommerce",     label: "쇼핑몰" },
  { id: "dashboard",     label: "대시보드" },
  { id: "entertainment", label: "엔터테인먼트" },
  { id: "utility",       label: "유틸리티" },
  { id: "social",        label: "소셜" },
  { id: "finance",       label: "금융" },
  { id: "productivity",  label: "생산성" },
  { id: "content",       label: "콘텐츠" },
  { id: "portfolio",     label: "포트폴리오" },
];

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner:     "초급",
  intermediate: "중급",
  advanced:     "고급",
};

const DIFFICULTY_COLOR: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  intermediate: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  advanced:     { bg: "rgba(239,68,68,0.15)",  color: "#ef4444" },
};

// ── Page Component ─────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const router = useRouter();
  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loading, setLoading]         = useState(true);
  const [category, setCategory]       = useState("all");
  const [sort, setSort]               = useState<"views" | "stars">("views");
  const [query, setQuery]             = useState("");
  const [debouncedQ, setDebouncedQ]   = useState("");
  const [hoveredId, setHoveredId]     = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (category !== "all") params.set("category", category);
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [category, sort, debouncedQ]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Navigate to workspace with prompt pre-filled
  const handleUse = (template: Template) => {
    const encoded = encodeURIComponent(template.prompt);
    router.push(`/workspace?prompt=${encoded}`);
  };

  return (
    <AppShell>
      <main style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#e6edf3",
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}>
        {/* ── Hero ── */}
        <section style={{
          padding: "64px 24px 40px",
          textAlign: "center",
          background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)",
          borderBottom: "1px solid #21262d",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 800, color: "#e6edf3",
            letterSpacing: "-0.5px", lineHeight: 1.2,
          }}>
            템플릿 마켓플레이스
          </h1>
          <p style={{
            margin: "12px auto 0", fontSize: 16, color: "#8b949e",
            maxWidth: 480, lineHeight: 1.6,
          }}>
            검증된 템플릿으로 즉시 시작하세요. AI가 코드를 생성합니다.
          </p>

          {/* Search bar */}
          <div style={{ marginTop: 28, maxWidth: 480, margin: "28px auto 0", position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "#6e7681", pointerEvents: "none",
            }}>🔍</span>
            <input
              type="text"
              placeholder="템플릿 검색... (예: 게임, 쇼핑몰)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 16px 12px 42px",
                borderRadius: 10, border: "1px solid #30363d",
                background: "#161b22", color: "#e6edf3",
                fontSize: 15, outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "#f97316"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#30363d"; }}
            />
          </div>
        </section>

        {/* ── Filters ── */}
        <div style={{
          position: "sticky", top: 56, zIndex: 10,
          background: "#0d1117", borderBottom: "1px solid #21262d",
          padding: "12px 24px",
          display: "flex", alignItems: "center", gap: 12,
          overflowX: "auto",
        }}>
          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: "1px solid",
                  whiteSpace: "nowrap", cursor: "pointer",
                  transition: "all 0.12s",
                  borderColor: category === cat.id ? "#f97316" : "#30363d",
                  background: category === cat.id ? "rgba(249,115,22,0.15)" : "transparent",
                  color: category === cat.id ? "#f97316" : "#8b949e",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {(["views", "stars"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: "1px solid",
                  cursor: "pointer", transition: "all 0.12s",
                  borderColor: sort === s ? "#58a6ff" : "#30363d",
                  background: sort === s ? "rgba(88,166,255,0.1)" : "transparent",
                  color: sort === s ? "#58a6ff" : "#8b949e",
                }}
              >
                {s === "views" ? "인기순" : "별점순"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Template Grid ── */}
        <div style={{ padding: "32px 24px", maxWidth: 1280, margin: "0 auto" }}>
          {loading ? (
            /* Skeleton loader */
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: 14, border: "1px solid #21262d",
                  background: "#161b22", overflow: "hidden",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}>
                  <div style={{ height: 140, background: "#21262d" }} />
                  <div style={{ padding: "16px" }}>
                    <div style={{ height: 16, background: "#21262d", borderRadius: 4, marginBottom: 8, width: "60%" }} />
                    <div style={{ height: 12, background: "#21262d", borderRadius: 4, width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              color: "#8b949e", fontSize: 16,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔭</div>
              <p>검색 결과가 없습니다.</p>
              <button
                onClick={() => { setQuery(""); setCategory("all"); }}
                style={{
                  marginTop: 12, padding: "8px 20px", borderRadius: 8,
                  border: "1px solid #30363d", background: "transparent",
                  color: "#8b949e", cursor: "pointer", fontSize: 14,
                }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}>
              {templates.map(t => {
                const diff = DIFFICULTY_COLOR[t.difficulty] ?? DIFFICULTY_COLOR.intermediate;
                const isHovered = hoveredId === t.id;
                return (
                  <article
                    key={t.id}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      borderRadius: 14,
                      border: `1px solid ${isHovered ? "#30363d" : "#21262d"}`,
                      background: isHovered ? "#1c2128" : "#161b22",
                      overflow: "hidden",
                      display: "flex", flexDirection: "column",
                      transition: "all 0.2s",
                      transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: isHovered ? "0 8px 30px rgba(0,0,0,0.4)" : "none",
                      cursor: "default",
                    }}
                  >
                    {/* Gradient thumbnail */}
                    <div style={{
                      height: 140,
                      background: t.preview_gradient,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 48,
                      position: "relative",
                    }}>
                      {t.icon}
                      {/* Category badge */}
                      <span style={{
                        position: "absolute", top: 10, right: 10,
                        padding: "3px 8px", borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                        background: "rgba(0,0,0,0.5)", color: "#e6edf3",
                        backdropFilter: "blur(4px)",
                        textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {t.category}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Title + difficulty */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <h2 style={{
                          margin: 0, fontSize: 15, fontWeight: 700, color: "#e6edf3",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {t.name}
                        </h2>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12,
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                          background: diff.bg, color: diff.color,
                        }}>
                          {DIFFICULTY_LABEL[t.difficulty] ?? t.difficulty}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{
                        margin: 0, fontSize: 13, color: "#8b949e",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        lineHeight: 1.5, flex: 1,
                      }}>
                        {t.description}
                      </p>

                      {/* Tags */}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.tags.slice(0, 3).map(tag => (
                          <span key={tag} style={{
                            padding: "2px 7px", borderRadius: 10,
                            fontSize: 11, background: "#21262d", color: "#8b949e",
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        fontSize: 12, color: "#6e7681", paddingTop: 4,
                      }}>
                        <span>⭐ {t.stars.toFixed(1)}</span>
                        <span>🍴 {t.forks}</span>
                        <span>👁 {t.views.toLocaleString()}</span>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleUse(t)}
                        style={{
                          marginTop: 4, width: "100%",
                          padding: "10px 0", borderRadius: 8,
                          border: "none", cursor: "pointer",
                          fontWeight: 700, fontSize: 13,
                          background: isHovered
                            ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)"
                            : "#21262d",
                          color: isHovered ? "#fff" : "#8b949e",
                          transition: "all 0.2s",
                          fontFamily: "inherit",
                        }}
                      >
                        사용하기 →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Result count ── */}
        {!loading && templates.length > 0 && (
          <div style={{
            textAlign: "center", padding: "0 24px 32px",
            fontSize: 13, color: "#6e7681",
          }}>
            {templates.length}개의 템플릿
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          /* Scrollbar for filter row */
          ::-webkit-scrollbar { height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
        `}</style>
      </main>
    </AppShell>
  );
}
