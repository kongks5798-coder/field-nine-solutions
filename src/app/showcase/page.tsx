import { createClient } from "@supabase/supabase-js";
import AppShell from "@/components/AppShell";
import { ShowcaseGrid } from "./ShowcaseGrid";

export const metadata = {
  title: "쇼케이스 — Dalkak",
  description: "Dalkak으로 만든 실제 앱들",
};

export const revalidate = 60; // ISR: 60초마다 갱신

type FilterTag = "전체" | "게임" | "앱" | "도구" | "웹사이트";

interface PublishedApp {
  slug: string;
  name: string;
  views: number;
  created_at: string;
  user_id: string | null;
}

const TAG_COLORS: Record<FilterTag, string> = {
  전체: "#f97316",
  게임: "#f43f5e",
  앱: "#3b82f6",
  도구: "#8b5cf6",
  웹사이트: "#10b981",
};

const FILTERS: FilterTag[] = ["전체", "게임", "앱", "도구", "웹사이트"];

function inferTag(name: string): FilterTag {
  const lower = name.toLowerCase();
  if (/게임|game|tetris|snake|puzzle|rpg|shooting|arcade|벽돌/.test(lower)) return "게임";
  if (/도구|tool|타이머|timer|계산기|calculator|변환|converter|날씨|weather/.test(lower)) return "도구";
  if (/앱|app|가계부|할일|todo|메모|note|일정|calendar/.test(lower)) return "앱";
  if (/쇼핑|shop|포트폴리오|portfolio|landing|랜딩|홈페이지|사이트/.test(lower)) return "웹사이트";
  return "앱";
}

function slugGradient(slug: string): string {
  const palettes = [
    "linear-gradient(135deg,#667eea,#764ba2)",
    "linear-gradient(135deg,#f97316,#f43f5e)",
    "linear-gradient(135deg,#11998e,#38ef7d)",
    "linear-gradient(135deg,#fc4a1a,#f7b733)",
    "linear-gradient(135deg,#4facfe,#00f2fe)",
    "linear-gradient(135deg,#43e97b,#38f9d7)",
    "linear-gradient(135deg,#fa709a,#fee140)",
    "linear-gradient(135deg,#a18cd1,#fbc2eb)",
    "linear-gradient(135deg,#fccb90,#d57eeb)",
    "linear-gradient(135deg,#0ba360,#3cba92)",
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return `${Math.floor(days / 30)}달 전`;
}

async function getPublishedApps(): Promise<PublishedApp[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabase
      .from("published_apps")
      .select("slug, name, views, created_at, user_id")
      .order("views", { ascending: false })
      .limit(24);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const activeTag = (FILTERS.includes(tag as FilterTag) ? tag : "전체") as FilterTag;

  const apps = await getPublishedApps();

  const filtered =
    activeTag === "전체"
      ? apps
      : apps.filter((a) => inferTag(a.name) === activeTag);

  const gridApps = filtered.map((app) => ({
    slug: app.slug,
    name: app.name,
    views: app.views,
    relTime: getRelativeTime(app.created_at),
    tag: inferTag(app.name),
    gradient: slugGradient(app.slug),
  }));

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1b1b1f", marginBottom: 8, letterSpacing: "-0.5px" }}>
            딸깍으로 만든 작품들
          </h1>
          <p style={{ fontSize: 17, color: "#6b7280", fontWeight: 500 }}>
            {apps.length > 0 ? `${apps.length}개의 실제 배포 앱` : "전 세계 개발자들의 창작물"}
          </p>
        </section>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <a
              key={f}
              href={f === "전체" ? "/showcase" : `/showcase?tag=${encodeURIComponent(f)}`}
              style={{
                padding: "7px 18px", borderRadius: 20, fontSize: 14, fontWeight: 600,
                textDecoration: "none",
                color: activeTag === f ? "#fff" : "#374151",
                background: activeTag === f ? TAG_COLORS[f] : "#f3f4f6",
                border: activeTag === f ? "none" : "1px solid #e5e7eb",
              }}
            >
              {f}
            </a>
          ))}
        </div>

        {/* Grid */}
        {gridApps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 8 }}>아직 배포된 앱이 없어요</div>
            <div style={{ fontSize: 14, marginBottom: 24 }}>첫 번째로 만들어보세요!</div>
            <a href="/workspace" style={{ padding: "11px 28px", borderRadius: 10, background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              앱 만들기 →
            </a>
          </div>
        ) : (
          <ShowcaseGrid apps={gridApps} />
        )}

        {/* CTA bottom */}
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <a href="/workspace" style={{
            padding: "14px 36px", borderRadius: 12,
            background: "linear-gradient(135deg,#f97316,#f43f5e)",
            color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 700,
            boxShadow: "0 8px 24px rgba(249,115,22,0.35)",
          }}>
            나도 만들기 →
          </a>
        </div>
      </div>
    </AppShell>
  );
}
