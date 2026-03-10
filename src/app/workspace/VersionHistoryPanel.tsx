"use client";

import React, { useState } from "react";
import { T } from "./workspace.constants";
import type { FilesMap, HistoryEntry } from "./workspace.constants";

// ── Local Version History ────────────────────────────────────────────────────

interface Props {
  history: HistoryEntry[];
  currentFiles: FilesMap;
  onRestore: (restored: FilesMap) => void;
  onClose: () => void;
}

function VersionHistoryPanelInner({ history, onRestore, onClose }: Props) {
  return (
    <div style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 300,
      height: "100%",
      background: T.bg,
      borderLeft: `1px solid ${T.border}`,
      zIndex: 40,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🕐 버전 히스토리</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{history.length}개 스냅샷 저장됨</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 4 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {history.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: T.muted, fontSize: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗂</div>
            <div>아직 저장된 버전이 없어요.</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>AI 생성 시 자동으로 스냅샷이 저장됩니다.</div>
          </div>
        ) : (
          [...history].reverse().map((entry, revIdx) => {
            const idx = history.length - 1 - revIdx;
            const fileCount = Object.keys(entry.files).length;
            return (
              <div key={entry.epoch ?? idx} style={{
                margin: "4px 10px", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.surface,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.label || "스냅샷"}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{entry.ts} · {fileCount}개 파일</div>
                  </div>
                  <button
                    onClick={() => onRestore(entry.files)}
                    style={{
                      flexShrink: 0, padding: "4px 10px", borderRadius: 6,
                      border: `1px solid rgba(249,115,22,0.3)`, background: "rgba(249,115,22,0.08)",
                      color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >복원</button>
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.keys(entry.files).slice(0, 4).map(name => (
                    <span key={name} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: T.muted }}>{name}</span>
                  ))}
                  {fileCount > 4 && <span style={{ fontSize: 9, color: T.muted }}>+{fileCount - 4}개</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default VersionHistoryPanelInner;

// ── Cloud Version Side Panel (슬라이드인, 우측 고정) ─────────────────────────

interface CloudSidePanelProps {
  projectId: string;
  onRestore: (restored: FilesMap) => void;
  onClose: () => void;
}

interface VersionMeta {
  id: string;
  label: string;
  created_at: string;
  file_count: number;
  size_bytes: number;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `오늘 ${new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDay === 1) return `어제 ${new Date(ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
  return new Date(ts).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CloudVersionSidePanel({ projectId, onRestore, onClose }: CloudSidePanelProps) {
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 자동 로드
  const loadVersions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions`);
      if (!res.ok) {
        setError("버전 목록을 불러올 수 없습니다.");
      } else {
        const data = await res.json() as { versions: VersionMeta[] };
        setVersions(Array.isArray(data.versions) ? data.versions : []);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => { void loadVersions(); }, [loadVersions]);

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`);
      if (res.ok) {
        const data = await res.json() as { version: { files: FilesMap } };
        if (data.version?.files) {
          onRestore(data.version.files);
          onClose();
        }
      }
    } catch { /* ignore */ }
    setRestoring(null);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: 300,
      height: "100%",
      background: "#111118",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-6px 0 24px rgba(0,0,0,0.4)",
      animation: "slideInRight 0.18s ease-out",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f4f8", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="6"/>
              <path d="M7 4v3l2 2"/>
            </svg>
            버전 히스토리
          </div>
          {!loading && (
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{versions.length}개 버전 저장됨</div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", fontSize: 16, padding: 4, lineHeight: 1,
            borderRadius: 4, transition: "color 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f0f4f8"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
        >✕</button>
      </div>

      {/* Current indicator */}
      <div style={{
        padding: "8px 12px",
        margin: "8px 10px 0",
        borderRadius: 8,
        background: "rgba(249,115,22,0.08)",
        border: "1px solid rgba(249,115,22,0.2)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>현재</div>
        <div style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 4,
          background: "rgba(249,115,22,0.15)", color: "#f97316", fontWeight: 600,
        }}>←</div>
      </div>

      {/* Version list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {loading ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
            <div style={{
              width: 20, height: 20, margin: "0 auto 12px",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#f97316",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
            불러오는 중...
          </div>
        ) : error ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10 }}>{error}</div>
            <button
              onClick={() => void loadVersions()}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "#f0f4f8", cursor: "pointer", fontFamily: "inherit",
              }}
            >다시 시도</button>
          </div>
        ) : versions.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🗂</div>
            <div>저장된 버전이 없습니다.</div>
            <div style={{ fontSize: 11, marginTop: 6, color: "#475569" }}>AI 생성 시 자동으로 저장됩니다.</div>
          </div>
        ) : (
          versions.map(v => (
            <VersionItem
              key={v.id}
              version={v}
              restoring={restoring === v.id}
              onRestore={() => void handleRestore(v.id)}
            />
          ))
        )}
      </div>

      {/* Refresh button */}
      {!loading && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <button
            onClick={() => void loadVersions()}
            style={{
              width: "100%", padding: "7px", borderRadius: 7, fontSize: 11, fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
              color: "#94a3b8", cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.1s, color 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#f0f4f8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
          >새로고침</button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function VersionItem({ version, restoring, onRestore }: { version: VersionMeta; restoring: boolean; onRestore: () => void }) {
  const [hover, setHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        margin: "3px 10px", padding: "9px 12px", borderRadius: 8,
        border: `1px solid ${hover ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
        background: hover ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.02)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        transition: "border-color 0.12s, background 0.12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: "#f0f4f8",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 2,
        }}>{version.label}</div>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>
          {formatRelativeTime(version.created_at)} · {version.file_count}개 파일
        </div>
      </div>
      <button
        onClick={onRestore}
        disabled={restoring}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          flexShrink: 0, padding: "4px 10px", borderRadius: 5,
          border: `1px solid ${btnHover ? "rgba(249,115,22,0.5)" : "rgba(249,115,22,0.25)"}`,
          background: btnHover ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.07)",
          color: "#f97316", fontSize: 10, fontWeight: 700, cursor: restoring ? "default" : "pointer",
          fontFamily: "inherit", opacity: restoring ? 0.6 : 1,
          transition: "border-color 0.1s, background 0.1s",
        }}
      >{restoring ? "..." : "복원"}</button>
    </div>
  );
}

// ── Remote (Cloud) Version History ──────────────────────────────────────────

interface RemoteProps {
  projectId: string;
  onRestore: (restored: FilesMap) => void;
  onClose: () => void;
}

export function RemoteVersionHistoryPanel({ projectId, onRestore, onClose }: RemoteProps) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; label: string; ts: string; files: FilesMap }>>([]);
  const [loaded, setLoaded] = useState(false);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(Array.isArray(data.versions) ? data.versions : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
    setLoaded(true);
  };

  return (
    <div style={{
      width: 380, background: T.bg, borderRadius: 14,
      border: `1px solid ${T.border}`, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>☁️ 클라우드 버전 히스토리</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
        {!loaded ? (
          <button
            onClick={loadVersions}
            disabled={loading}
            style={{
              width: "100%", padding: "10px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.surface, color: T.text,
              fontSize: 12, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "로딩 중..." : "클라우드 버전 불러오기"}
          </button>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: "center", color: T.muted, fontSize: 12, padding: "20px 0" }}>저장된 클라우드 버전이 없습니다.</div>
        ) : (
          versions.map(v => (
            <div key={v.id} style={{
              padding: "10px 12px", marginBottom: 8, borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.surface,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.label}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{v.ts}</div>
              </div>
              <button
                onClick={() => { onRestore(v.files); onClose(); }}
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  border: `1px solid rgba(249,115,22,0.3)`, background: "rgba(249,115,22,0.08)",
                  color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >복원</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
