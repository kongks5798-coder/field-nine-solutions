import { createServerClient } from "@supabase/ssr";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Collection {
  id: string;
  name: string;
  description: string | null;
  app_count: number;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchCollections(userId: string): Promise<Collection[]> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await supabase
    .from("collections")
    .select(
      `id, name, description,
       collection_apps(count)`
    )
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id:          c.id,
    name:        c.name,
    description: (c.description as string | null) ?? null,
    app_count:
      Array.isArray(c.collection_apps)
        ? ((c.collection_apps[0] as { count: number } | undefined)?.count ?? 0)
        : 0,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId:  string;
  isOwner: boolean;
}

export default async function CollectionsSection({ userId, isOwner }: Props) {
  const collections = await fetchCollections(userId);

  if (collections.length === 0 && !isOwner) return null;

  return (
    <section style={{ marginTop: 52 }}>
      {/* Section heading */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 20,
          color: "#e6edf3",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        컬렉션
        {collections.length > 0 && (
          <span style={{ color: "#8b949e", fontWeight: 400, fontSize: 15 }}>
            ({collections.length}개)
          </span>
        )}
      </h2>

      {/* Empty state — own profile only */}
      {collections.length === 0 && isOwner && (
        <a
          href="/my-apps"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 10,
            border: "1.5px dashed rgba(0,0,0,0.18)",
            background: "#fdf8f3",
            color: "#92400e",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          + 새 컬렉션 만들기
        </a>
      )}

      {/* Collections grid */}
      {collections.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <a
      href={`/collections/${collection.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        style={{
          background: "#fdf8f3",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          transition: "box-shadow 0.15s",
          cursor: "pointer",
        }}
      >
        {/* Name + app count badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "#1a1a2e",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {collection.name}
          </span>
          <span
            style={{
              flexShrink: 0,
              padding: "2px 9px",
              borderRadius: 20,
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
              fontSize: 11,
              fontWeight: 700,
              color: "#c2410c",
              whiteSpace: "nowrap",
            }}
          >
            {collection.app_count}개
          </span>
        </div>

        {/* Description snippet */}
        {collection.description && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#6b7280",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.5,
            }}
          >
            {collection.description}
          </p>
        )}

        {/* CTA */}
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            fontWeight: 600,
            color: "#f97316",
            textAlign: "right",
          }}
        >
          보기 →
        </div>
      </div>
    </a>
  );
}
