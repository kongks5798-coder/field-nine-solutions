"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { T } from "@/lib/theme";
import { getAuthUser, type AuthUser } from "@/utils/supabase/auth";
import AppShell from "@/components/AppShell";

interface QualityScore {
  id: string;
  app_name: string;
  score: number;
  issues_count: number;
  pipeline_type: string;
  platform: string | null;
  created_at: string;
}

interface PublishedApp {
  slug: string;
  name: string;
  views: number;
  likes: number | null;
  forks: number | null;
  created_at: string;
  updated_at: string;
}

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (r.status === 401) throw new Error("UNAUTHORIZED");
    if (!r.ok) throw new Error("FETCH_ERROR");
    return r.json();
  });

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatBadge({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${T.border}`,
        fontSize: 13,
        color: T.text,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontWeight: 600 }}>{(value ?? 0).toLocaleString()}</span>
      <span style={{ color: T.textMuted, fontSize: 11 }}>{label}</span>
    </div>
  );
}

function AppCard({ app, onDelete }: { app: PublishedApp; onDelete: (slug: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${app.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      onDelete(app.slug);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      alert("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <>
      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "28px 32px",
              maxWidth: 380,
              width: "90%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 10 }}>
              앱을 삭제할까요?
            </div>
            <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
              <strong style={{ color: T.text }}>{app.name}</strong>을 삭제하면 복구할 수 없습니다.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textMuted,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${T.border}`,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  background: deleting ? "rgba(239,68,68,0.5)" : "#ef4444",
                  border: "none",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          transition: "border-color 0.15s, box-shadow 0.15s",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = T.accent;
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${T.accent}22`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {app.name}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, fontFamily: "monospace" }}>
              /p/{app.slug}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
            <a
              href={`/p/${app.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="앱 미리보기"
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                color: T.text,
                background: "rgba(255,255,255,0.07)",
                border: `1px solid ${T.border}`,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              미리보기 ↗
            </a>
            <a
              href={`/workspace?q=${encodeURIComponent(app.slug)}`}
              title="수정하기"
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: T.gradient,
                border: "none",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              수정
            </a>

            {/* ··· menu button */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                title="더 보기"
                style={{
                  padding: "5px 9px",
                  borderRadius: 7,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  cursor: "pointer",
                  lineHeight: 1,
                  letterSpacing: "0.05em",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                }}
              >
                ···
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 100,
                    background: "#111118",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    overflow: "hidden",
                    minWidth: 140,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDelete(true);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "11px 16px",
                      textAlign: "left",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#ef4444",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatBadge icon="👁" value={app.views ?? 0} label="조회수" />
          <StatBadge icon="❤️" value={app.likes ?? 0} label="좋아요" />
          <StatBadge icon="🍴" value={app.forks ?? 0} label="포크수" />
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: T.muted, display: "flex", gap: 12 }}>
          <span>생성일: {formatDate(app.created_at)}</span>
          <span>수정일: {formatDate(app.updated_at)}</span>
        </div>
      </div>
    </>
  );
}

// ── Quality Trend Chart (pure CSS/JSX, no external charting library) ─────────

function QualityTrendChart({ scores }: { scores: QualityScore[] }) {
  const recent = scores.slice(0, 10).reverse();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
      {recent.map((s, i) => (
        <div
          key={i}
          title={`${s.app_name}: ${s.score}점`}
          style={{
            width: 20,
            height: `${Math.max(s.score, 4)}%`,
            background: s.score >= 85 ? "#22c55e" : s.score >= 70 ? "#f97316" : "#ef4444",
            borderRadius: "2px 2px 0 0",
            transition: "all 0.3s",
            cursor: "pointer",
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
}

// ── Quality Stats Bar ─────────────────────────────────────────────────────────

function QualityStatsBar({ scores }: { scores: QualityScore[] }) {
  if (scores.length === 0) return null;

  const avg = Math.round(scores.reduce((s, q) => s + q.score, 0) / scores.length);
  const best = Math.max(...scores.map((q) => q.score));

  const avgColor = avg >= 85 ? "#22c55e" : avg >= 70 ? "#f97316" : "#ef4444";
  const bestColor = best >= 85 ? "#22c55e" : best >= 70 ? "#f97316" : "#ef4444";

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "center",
        padding: "16px 20px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        품질 트렌드
      </div>

      {/* Average */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: T.textMuted }}>평균 품질</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: avgColor }}>{avg}</span>
        <span style={{ fontSize: 11, color: T.textMuted }}>/100</span>
      </div>

      {/* Best */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: T.textMuted }}>최고 점수</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: bestColor }}>{best}</span>
        <span style={{ fontSize: 11, color: T.textMuted }}>/100</span>
      </div>

      {/* Mini chart */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: T.textMuted }}>최근 트렌드</span>
        <QualityTrendChart scores={scores} />
      </div>

      {/* Score count badge */}
      <div
        style={{
          marginLeft: "auto",
          padding: "3px 10px",
          borderRadius: 20,
          background: `${T.accent}22`,
          border: `1px solid ${T.accent}44`,
          fontSize: 11,
          fontWeight: 700,
          color: T.accent,
        }}
      >
        {scores.length}회 생성
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MyAppsContent() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [localApps, setLocalApps] = useState<PublishedApp[] | null>(null);

  useEffect(() => {
    getAuthUser().then((u) => {
      setUser(u);
      if (!u) router.replace("/login");
    });
  }, [router]);

  const { data, error, isLoading } = useSWR<{ apps: PublishedApp[] }>(
    user ? "/api/apps/mine" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (d) => setLocalApps(d.apps),
    }
  );

  function handleDelete(slug: string) {
    setLocalApps((prev) => (prev ? prev.filter((a) => a.slug !== slug) : prev));
    // Also invalidate SWR cache so re-focus refetches correctly
    globalMutate("/api/apps/mine");
  }

  const { data: qualityData } = useSWR<{ scores: QualityScore[] }>(
    user ? "/api/quality/scores?limit=20" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const apps = localApps ?? data?.apps ?? [];
  const qualityScores = qualityData?.scores ?? [];
  const totalViews = apps.reduce((s, a) => s + (a.views ?? 0), 0);
  const totalLikes = apps.reduce((s, a) => s + (a.likes ?? 0), 0);
  const totalForks = apps.reduce((s, a) => s + (a.forks ?? 0), 0);

  // Auth loading
  if (user === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: T.textMuted, fontSize: 14 }}>
        인증 확인 중...
      </div>
    );
  }

  if (!user) return null; // redirect in progress

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: T.fontStack,
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text }}>
              내 앱
            </h1>
            {!isLoading && (
              <span style={{
                padding: "3px 10px",
                borderRadius: 20,
                background: `${T.accent}22`,
                border: `1px solid ${T.accent}44`,
                fontSize: 13,
                fontWeight: 700,
                color: T.accent,
              }}>
                {apps.length}개
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: T.textMuted }}>
            내가 배포한 앱들의 조회수, 좋아요, 포크 현황을 확인하세요
          </p>
        </div>

        {/* Summary stats bar */}
        {!isLoading && apps.length > 0 && (
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 28,
            padding: "16px 20px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            flexWrap: "wrap",
          }}>
            {[
              { icon: "📦", value: apps.length, label: "총 앱 수" },
              { icon: "👁", value: totalViews, label: "총 조회수" },
              { icon: "❤️", value: totalLikes, label: "총 좋아요" },
              { icon: "🍴", value: totalForks, label: "총 포크수" },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 120px" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quality trend section — only shown when user has quality score data */}
        {qualityScores.length > 0 && <QualityStatsBar scores={qualityScores} />}

        {/* Error state */}
        {error && (
          <div style={{
            padding: "20px 24px",
            background: `${T.red}11`,
            border: `1px solid ${T.red}44`,
            borderRadius: 12,
            color: T.red,
            fontSize: 14,
            marginBottom: 24,
          }}>
            앱 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                height: 160,
                opacity: 0.5,
                animation: "pulse 1.4s ease-in-out infinite",
              }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && apps.length === 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            gap: 16,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 56 }}>🚀</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>
              아직 배포한 앱이 없어요
            </div>
            <div style={{ fontSize: 14, color: T.textMuted, maxWidth: 320 }}>
              첫 앱을 만들어 세상에 공유해보세요!
            </div>
            <a
              href="/workspace"
              style={{
                marginTop: 8,
                padding: "12px 28px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                background: T.gradient,
                textDecoration: "none",
              }}
            >
              첫 앱을 만들어보세요! →
            </a>
          </div>
        )}

        {/* App grid */}
        {!isLoading && apps.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}>
            {apps.map((app) => (
              <AppCard key={app.slug} app={app} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyAppsPage() {
  return (
    <AppShell>
      <MyAppsContent />
    </AppShell>
  );
}
