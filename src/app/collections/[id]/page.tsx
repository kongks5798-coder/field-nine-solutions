import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollectionApp {
  slug: string;
  name: string;
  likes: number | null;
}

interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  apps: CollectionApp[];
}

// ── Gradient palette (seed-based, same as profile page) ───────────────────────

const GRADIENTS = [
  "linear-gradient(135deg,#e8e4dc,#d4cfc5)",
  "linear-gradient(135deg,#dce8e4,#c5d4cf)",
  "linear-gradient(135deg,#e4dce8,#cfc5d4)",
  "linear-gradient(135deg,#e8e4dc,#c5cfd4)",
  "linear-gradient(135deg,#dce4e8,#d4c5cf)",
  "linear-gradient(135deg,#e8dce4,#c5d4c5)",
];

function pickGradient(seed: string): string {
  return GRADIENTS[seed.charCodeAt(0) % GRADIENTS.length];
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchCollection(id: string): Promise<CollectionDetail | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Fetch collection metadata
  const { data: col, error: colErr } = await supabase
    .from("collections")
    .select("id, name, description, is_public, user_id, created_at")
    .eq("id", id)
    .single();

  if (colErr || !col) return null;

  // Fetch apps in this collection via collection_apps join
  const { data: caRows } = await supabase
    .from("collection_apps")
    .select("app_slug")
    .eq("collection_id", id)
    .order("added_at", { ascending: false });

  const slugs = (caRows ?? []).map((r: { app_slug: string }) => r.app_slug);

  let apps: CollectionApp[] = [];
  if (slugs.length > 0) {
    const { data: appRows } = await supabase
      .from("published_apps")
      .select("slug, name, likes")
      .in("slug", slugs);

    // Preserve the collection_apps order
    const appMap = new Map(
      (appRows ?? []).map((a: { slug: string; name: string; likes: number | null }) => [a.slug, a])
    );
    apps = slugs
      .map((s: string) => appMap.get(s))
      .filter((a): a is CollectionApp => Boolean(a));
  }

  return {
    id:          col.id as string,
    name:        col.name as string,
    description: (col.description as string | null) ?? null,
    is_public:   col.is_public as boolean,
    user_id:     col.user_id as string,
    created_at:  col.created_at as string,
    apps,
  };
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const collection = await fetchCollection(id);
  if (!collection || !collection.is_public) {
    return { title: "컬렉션을 찾을 수 없습니다" };
  }

  return {
    title: `${collection.name} — Dalkak 컬렉션`,
    description:
      collection.description ??
      `${collection.apps.length}개의 AI 웹앱이 담긴 컬렉션`,
    openGraph: {
      title: collection.name,
      description:
        collection.description ??
        `${collection.apps.length}개의 AI 웹앱이 담긴 컬렉션`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${collection.name} — Dalkak 컬렉션`,
      description:
        collection.description ??
        `${collection.apps.length}개의 AI 웹앱이 담긴 컬렉션`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await fetchCollection(id);

  // 404 if not found or private
  if (!collection || !collection.is_public) notFound();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        color: "#0a0a0a",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(250,248,245,0.95)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <a
          href="/"
          style={{
            color: "#0a0a0a",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#0a0a0a",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 11,
              color: "#faf8f5",
            }}
          >
            D
          </span>
          Dalkak
        </a>

        <a
          href="/workspace"
          style={{
            background: "#0a0a0a",
            color: "#faf8f5",
            padding: "7px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          앱 만들기
        </a>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 96px" }}>

        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "rgba(0,0,0,0.4)",
            marginBottom: 32,
          }}
        >
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            홈
          </a>
          <span>/</span>
          <span>컬렉션</span>
          <span>/</span>
          <span
            style={{
              color: "rgba(0,0,0,0.7)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 200,
            }}
          >
            {collection.name}
          </span>
        </div>

        {/* ── Collection header ─────────────────────────────────────── */}
        <header style={{ marginBottom: 48 }}>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 36,
              fontWeight: 800,
              color: "#0a0a0a",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {collection.name}
          </h1>

          {collection.description && (
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 16,
                color: "rgba(0,0,0,0.55)",
                lineHeight: 1.65,
                maxWidth: 600,
              }}
            >
              {collection.description}
            </p>
          )}

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "rgba(0,0,0,0.4)",
              fontSize: 13,
            }}
          >
            <span>
              {collection.apps.length > 0
                ? `앱 ${collection.apps.length}개`
                : "앱 없음"}
            </span>
            <span
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.25)",
                flexShrink: 0,
              }}
            />
            <span>
              {new Date(collection.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(0,0,0,0.08)",
            marginBottom: 40,
          }}
        />

        {/* ── Apps grid ─────────────────────────────────────────────── */}
        {collection.apps.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "72px 24px",
              background: "rgba(0,0,0,0.02)",
              border: "1px dashed rgba(0,0,0,0.12)",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 16,
                opacity: 0.3,
                lineHeight: 1,
              }}
            >
              &#x1F4E6;
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "rgba(0,0,0,0.4)",
              }}
            >
              이 컬렉션에는 아직 앱이 없습니다
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
              gap: 18,
            }}
          >
            {collection.apps.map((app, i) => (
              <AppCard
                key={app.slug}
                app={app}
                gradient={pickGradient(app.slug + i)}
              />
            ))}
          </div>
        )}

        {/* ── Footer CTA ────────────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 80,
            paddingTop: 48,
            borderTop: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <p
            style={{
              color: "rgba(0,0,0,0.45)",
              marginBottom: 20,
              fontSize: 15,
            }}
          >
            나도 AI로 웹앱을 만들어볼까요?
          </p>
          <a
            href="/workspace"
            style={{
              display: "inline-block",
              background: "#0a0a0a",
              color: "#faf8f5",
              padding: "13px 36px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            지금 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}

// ── App card (server component) ───────────────────────────────────────────────

function AppCard({
  app,
  gradient,
}: {
  app: CollectionApp;
  gradient: string;
}) {
  return (
    <a
      href={`/p/${app.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          overflow: "hidden",
          transition: "box-shadow 0.15s",
        }}
      >
        {/* Thumbnail placeholder */}
        <div
          style={{
            height: 130,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* subtle icon placeholder */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
        </div>

        {/* Card body */}
        <div style={{ padding: "14px 16px 16px" }}>
          <div
            style={{
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "-0.015em",
              marginBottom: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "rgba(0,0,0,0.4)",
              fontSize: 12,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{(app.likes ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
