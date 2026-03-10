import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import CollectionsSection from "./CollectionsSection";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  plan?: string;
  created_at: string;
  username: string;
}

interface AppData {
  slug: string;
  name: string;
  description?: string;
  views?: number;
  likes?: number;
  created_at: string;
}

interface StatsData {
  appCount: number;
  totalViews: number;
  totalLikes: number;
}

// ─── Gradient palette ─────────────────────────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#1db954,#191414)",
  "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
  "linear-gradient(135deg,#2980b9,#6dd5fa)",
  "linear-gradient(135deg,#f7971e,#fa709a)",
];

function pickGradient(seed: string): string {
  return GRADIENTS[seed.charCodeAt(0) % GRADIENTS.length];
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchUserData(username: string): Promise<{
  profile: ProfileData;
  apps: AppData[];
  stats: StatsData;
} | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/users/${username}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<{ profile: ProfileData; apps: AppData[]; stats: StatsData }>;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchUserData(username);
  if (!data) return { title: "사용자를 찾을 수 없습니다" };

  const { profile } = data;
  const displayName = profile.full_name ?? username;

  return {
    title: `${displayName} — Dalkak 포트폴리오`,
    description: profile.bio ?? `${username}님의 AI 웹앱 포트폴리오`,
    openGraph: {
      title: `${displayName}의 포트폴리오`,
      description: profile.bio ?? `${username}님의 AI 웹앱 포트폴리오`,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} — Dalkak 포트폴리오`,
      description: profile.bio ?? `${username}님의 AI 웹앱 포트폴리오`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await fetchUserData(username);
  if (!data) notFound();

  const { profile, apps, stats } = data;
  const displayName = profile.full_name ?? username;
  const avatarGradient = pickGradient(username);
  const avatarLetter = (displayName[0] ?? username[0]).toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #21262d",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "rgba(13,17,23,0.95)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <a
          href="/"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg,#f97316,#f43f5e)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 11,
              color: "#fff",
            }}
          >
            D
          </span>
          Dalkak
        </a>
        <a
          href="/workspace"
          style={{
            background: "#238636",
            color: "#fff",
            padding: "7px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          앱 만들기
        </a>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* ── Profile hero ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 28,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              flexShrink: 0,
              background: profile.avatar_url ? "transparent" : avatarGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              border: "3px solid #30363d",
            }}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              avatarLetter
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#e6edf3" }}>
              {displayName}
            </h1>
            <p style={{ color: "#8b949e", margin: "4px 0 0", fontSize: 14 }}>
              @{username}
            </p>
            {profile.bio && (
              <p
                style={{
                  color: "#c9d1d9",
                  margin: "12px 0 0",
                  fontSize: 15,
                  lineHeight: 1.6,
                  maxWidth: 560,
                }}
              >
                {profile.bio}
              </p>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#58a6ff",
                  fontSize: 13,
                  marginTop: 8,
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                {profile.website.replace(/^https?:\/\//, "")} ↗
              </a>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  color: "#8b949e",
                }}
              >
                {new Date(profile.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}{" "}
                가입
              </span>
              {profile.plan && profile.plan !== "free" && profile.plan !== "starter" && (
                <span
                  style={{
                    background: "#0d2818",
                    border: "1px solid #238636",
                    padding: "3px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    color: "#3fb950",
                    fontWeight: 700,
                  }}
                >
                  ★ {profile.plan.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 44,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "퍼블리시된 앱", value: stats.appCount.toString(), icon: "📦" },
            { label: "총 조회수", value: stats.totalViews.toLocaleString(), icon: "👁" },
            { label: "총 좋아요", value: stats.totalLikes.toLocaleString(), icon: "❤️" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: "18px 28px",
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#e6edf3" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Apps grid ────────────────────────────────────────── */}
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
          퍼블리시된 앱
          {apps.length > 0 && (
            <span style={{ color: "#8b949e", fontWeight: 400, fontSize: 15 }}>
              ({apps.length}개)
            </span>
          )}
        </h2>

        {apps.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 24px",
              color: "#8b949e",
              background: "#161b22",
              borderRadius: 14,
              border: "1px dashed #30363d",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
            <p style={{ fontSize: 15, margin: 0 }}>아직 퍼블리시된 앱이 없습니다</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
              gap: 16,
            }}
          >
            {apps.map((app, i) => (
              <AppCard key={app.slug} app={app} gradient={GRADIENTS[i % GRADIENTS.length]} />
            ))}
          </div>
        )}

        {/* ── Collections ──────────────────────────────────────── */}
        <CollectionsSection userId={profile.id} isOwner={false} />

        {/* ── Footer CTA ───────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            marginTop: 72,
            paddingTop: 48,
            borderTop: "1px solid #21262d",
          }}
        >
          <p style={{ color: "#8b949e", marginBottom: 18, fontSize: 15 }}>
            나도 AI로 웹앱을 만들어볼까요?
          </p>
          <a
            href="/signup"
            style={{
              background: "#238636",
              color: "#fff",
              padding: "13px 36px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 16,
              display: "inline-block",
            }}
          >
            무료로 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── App card (server component — no event handlers) ─────────────────────────

function AppCard({ app, gradient }: { app: AppData; gradient: string }) {
  return (
    <a href={`/p/${app.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Gradient thumbnail */}
        <div
          style={{
            height: 124,
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
          }}
        >
          🚀
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <div
            style={{
              color: "#e6edf3",
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {app.name}
          </div>
          {app.description && (
            <div
              style={{
                color: "#8b949e",
                fontSize: 13,
                marginBottom: 10,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {app.description}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              color: "#6e7681",
              fontSize: 12,
              alignItems: "center",
            }}
          >
            <span>👁 {(app.views ?? 0).toLocaleString()}</span>
            <span>❤️ {(app.likes ?? 0).toLocaleString()}</span>
            <span style={{ marginLeft: "auto" }}>
              {new Date(app.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
