"use client";

import { useState, useEffect } from "react";
import { T, tokToUSD } from "./workspace.constants";

interface SecurityIssue {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface SecurityScanResult {
  safe: boolean;
  score: number;
  issues: SecurityIssue[];
}

type ScanState = "idle" | "scanning" | "done" | "error";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  publishedUrl: string;
  tokenBalance: number;
  showToast: (msg: string) => void;
  onAiImprove?: (prompt: string) => void;
  /** Optional: raw HTML content to run security scan against */
  htmlContent?: string;
}

const EMBED_SIZES = {
  small:  { width: 400, height: 300, label: "소" },
  medium: { width: 640, height: 480, label: "중" },
  large:  { width: 900, height: 600, label: "대" },
} as const;
type EmbedSize = keyof typeof EMBED_SIZES;

// ── Security Badge Component ──────────────────────────────────────────────────

function SecurityBadge({ scanState, result }: { scanState: ScanState; result: SecurityScanResult | null }) {
  const [expanded, setExpanded] = useState(false);

  if (scanState === "idle") return null;

  if (scanState === "scanning") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 12px", borderRadius: 8, marginBottom: 10,
        background: "rgba(107,114,128,0.08)", border: `1px solid ${T.border}`,
        fontSize: 11, color: T.muted,
      }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>🔍</span>
        보안 검사 중...
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (scanState === "error" || !result) {
    return (
      <div style={{
        padding: "7px 12px", borderRadius: 8, marginBottom: 10,
        background: "rgba(107,114,128,0.06)", border: `1px solid ${T.border}`,
        fontSize: 11, color: T.muted,
      }}>
        ⚠️ 보안 검사 실패 (네트워크 오류)
      </div>
    );
  }

  const highCount = result.issues.filter(i => i.severity === "high").length;
  const totalIssues = result.issues.length;
  const isWarning = !result.safe || totalIssues > 0;

  const badgeBg = result.safe
    ? "rgba(22,163,74,0.08)"
    : "rgba(234,88,12,0.08)";
  const badgeBorder = result.safe
    ? "rgba(22,163,74,0.25)"
    : "rgba(234,88,12,0.3)";
  const badgeColor = result.safe ? T.green : T.warn;

  return (
    <div style={{
      borderRadius: 8, marginBottom: 10,
      background: badgeBg, border: `1px solid ${badgeBorder}`,
      overflow: "hidden",
    }}>
      {/* Badge header row */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", fontSize: 11, color: badgeColor,
          cursor: isWarning ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={() => isWarning && setExpanded(v => !v)}
        role={isWarning ? "button" : undefined}
        aria-expanded={isWarning ? expanded : undefined}
      >
        <span>{result.safe ? "✅" : "⚠️"}</span>
        <span style={{ flex: 1 }}>
          {result.safe
            ? "보안 검사 통과"
            : `${totalIssues}개 보안 이슈 발견${highCount > 0 ? ` (고위험 ${highCount}개)` : ""}`}
        </span>
        <span style={{ fontSize: 10, color: T.muted }}>
          점수 {result.score}/100
        </span>
        {isWarning && (
          <span style={{ fontSize: 10, color: T.muted, marginLeft: 2 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Expandable issue list */}
      {isWarning && expanded && result.issues.length > 0 && (
        <div style={{ borderTop: `1px solid ${badgeBorder}`, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          {result.issues.map((issue, idx) => {
            const sevColor = issue.severity === "high" ? T.red : issue.severity === "medium" ? T.warn : T.muted;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 10, color: T.text, lineHeight: 1.5 }}>
                <span style={{ color: sevColor, fontWeight: 700, minWidth: 28, flexShrink: 0 }}>
                  {issue.severity === "high" ? "HIGH" : issue.severity === "medium" ? "MED" : "LOW"}
                </span>
                <span style={{ color: T.muted }}>{issue.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PublishModal({ open, onClose, publishedUrl, tokenBalance, showToast, onAiImprove, htmlContent }: PublishModalProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedSize, setEmbedSize] = useState<EmbedSize>("medium");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Subdomain state
  const [subdomainInput, setSubdomainInput] = useState("");
  const [subdomainSaving, setSubdomainSaving] = useState(false);
  const [subdomainSaved, setSubdomainSaved] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [savedSubdomain, setSavedSubdomain] = useState<string | null>(null);

  // Security scan state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);

  // Auto-trigger scan when modal opens with HTML content
  useEffect(() => {
    if (!open || !htmlContent) return;

    setScanState("scanning");
    setScanResult(null);

    fetch("/api/security/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: htmlContent.slice(0, 500_000) }),
    })
      .then(res => res.json())
      .then((data: SecurityScanResult) => {
        setScanResult(data);
        setScanState("done");
      })
      .catch(() => {
        setScanState("error");
      });
  }, [open, htmlContent]);

  // Reset scan state when modal closes
  useEffect(() => {
    if (!open) {
      setScanState("idle");
      setScanResult(null);
    }
  }, [open]);

  const handleSubdomainSave = async () => {
    const sub = subdomainInput.trim().toLowerCase();
    if (!sub) return;
    if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(sub)) {
      setSubdomainError("영문 소문자·숫자·하이픈만, 3~20자 (시작/끝은 영숫자)");
      return;
    }
    setSubdomainError(null);
    setSubdomainSaving(true);
    try {
      const res = await fetch("/api/projects/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: sub }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) {
        setSubdomainError(data.error ?? "저장 실패");
      } else {
        setSavedSubdomain(sub);
        setSubdomainSaved(true);
        showToast(`✅ ${sub}.fieldnine.io 설정 완료!`);
      }
    } catch {
      setSubdomainError("네트워크 오류");
    } finally {
      setSubdomainSaving(false);
    }
  };

  const handleAiImprove = async (slug: string) => {
    if (!onAiImprove || loadingFeedback) return;
    setLoadingFeedback(true);
    try {
      const res = await fetch(`/api/published/${encodeURIComponent(slug)}/comments`);
      const data = await res.json();
      const comments: Array<{ content: string }> = data.comments ?? [];
      if (comments.length === 0) {
        showToast("💬 아직 피드백이 없어요. 앱을 공유해서 피드백을 받아보세요!");
        return;
      }
      const feedbackLines = comments.slice(0, 20).map((c, i) => `${i + 1}. ${c.content}`).join("\n");
      const prompt = `배포된 앱에 다음 사용자 피드백이 달렸어. 이 피드백을 반영해서 현재 앱을 개선해줘:\n\n사용자 피드백 ${comments.length}개:\n${feedbackLines}\n\n개선된 전체 코드를 [FILE:]...[/FILE] 형식으로 출력해줘.`;
      onAiImprove(prompt);
      onClose();
      showToast(`🤖 ${comments.length}개 피드백으로 AI 개선 시작!`);
    } catch {
      showToast("피드백 로드 실패");
    } finally {
      setLoadingFeedback(false);
    }
  };

  if (!open) return null;
  const isAnon = publishedUrl.includes("?anon=1");
  const cleanUrl = publishedUrl.replace("?anon=1", "");
  const isDataUrl = publishedUrl.includes("/p#");

  // Extract slug from URL like /p/some-slug or https://fieldnine.io/p/some-slug
  const slugMatch = cleanUrl.match(/\/p\/([^/?#]+)/);
  const slug = slugMatch ? slugMatch[1] : null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://fieldnine.io";
  const embedUrl = slug ? `${origin}/embed/${slug}` : null;
  const { width, height } = EMBED_SIZES[embedSize];
  const iframeCode = embedUrl
    ? `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allow="scripts" style="border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);"></iframe>`
    : "";

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Dalkak AI로 만든 웹앱을 공유합니다!")}&url=${encodeURIComponent(cleanUrl)}`;

  function copyEmbed() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      showToast("</> 임베드 코드 복사됨");
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 28px 70px rgba(0,0,0,0.75)" }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">🚀</div>
        <div id="publish-title" style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>배포 완료!</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: isAnon ? 10 : 20, lineHeight: 1.7 }}>
          앱이 배포되었습니다. 아래 링크를 공유하면 누구든지 접근할 수 있습니다.
        </div>

        {/* Anonymous deploy notice */}
        {isAnon && (
          <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#f97316", lineHeight: 1.6 }}>
            <strong>비로그인 배포</strong> — URL이 7일 후 만료됩니다.<br />
            <a href="/login" style={{ color: "#f97316", fontWeight: 700 }}>로그인</a>하면 영구 URL + 커스텀 이름을 받을 수 있어요.
          </div>
        )}

        <div
          aria-label="배포된 앱 URL"
          style={{ background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 10, color: "#7a8098", wordBreak: "break-all", fontFamily: "monospace", maxHeight: 76, overflowY: "auto", lineHeight: 1.6 }}
        >
          {isDataUrl ? "(오프라인 모드 — 긴 데이터 URL)" : cleanUrl}
        </div>

        {/* Security scan badge */}
        <SecurityBadge scanState={scanState} result={scanResult} />

        <div style={{ fontSize: 10, color: T.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: T.green }} aria-hidden="true">✓</span>
          토큰 잔액: <strong style={{ color: T.text }}>{tokToUSD(tokenBalance)}</strong>
          <span style={{ color: T.border }}>·</span>
          AI 사용 시 $0.05 ~ $5.95 차감됩니다
        </div>

        {/* Main actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(cleanUrl).catch(() => {}); showToast("🔗 URL 복사됨"); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            🔗 링크 복사
          </button>
          <button
            onClick={() => window.open(cleanUrl, "_blank")}
            aria-label="새 탭에서 열기"
            style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            ↗ 새 탭
          </button>
          <button
            onClick={onClose}
            style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            닫기
          </button>
        </div>

        {/* Share row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {/* KakaoTalk share — native Web Share API (shows KakaoTalk on mobile) */}
          <button
            onClick={() => {
              const shareText = "딸깍 AI로 만든 웹앱을 확인해보세요! 🚀";
              if (navigator.share) {
                navigator.share({ title: "내 앱 공유", text: shareText, url: cleanUrl }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareText + "\n" + cleanUrl).catch(() => {});
                showToast("📋 카카오톡에 붙여넣기하세요!");
              }
            }}
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(254,229,0,0.3)",
              background: "#FEE500", color: "#3a1d1d", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            💬 카카오톡 공유
          </button>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: `1px solid ${T.border}`,
              background: "#f3f4f6", color: T.text, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            𝕏 트위터
          </a>
          {slug && !isDataUrl && (
            <button
              onClick={() => setShowEmbed(v => !v)}
              style={{
                flex: 1, padding: "9px", borderRadius: 10,
                border: `1px solid ${showEmbed ? T.accent : T.border}`,
                background: showEmbed ? `rgba(249,115,22,0.08)` : "rgba(255,255,255,0.04)",
                color: showEmbed ? T.accent : T.text,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {"</>"} 임베드
            </button>
          )}
        </div>

        {/* AI 피드백 개선 */}
        {slug && !isDataUrl && onAiImprove && (
          <button
            onClick={() => handleAiImprove(slug)}
            disabled={loadingFeedback}
            style={{
              width: "100%", marginBottom: 12, padding: "11px",
              borderRadius: 10, border: "none",
              background: loadingFeedback ? T.muted : "linear-gradient(135deg,#f97316,#f97316cc)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: loadingFeedback ? "default" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loadingFeedback ? "⏳ 피드백 불러오는 중..." : "🤖 피드백으로 AI 개선"}
          </button>
        )}

        {/* ── 커스텀 서브도메인 설정 ── */}
        {!isDataUrl && !isAnon && (
          <div style={{
            marginTop: 14, padding: "14px 16px", borderRadius: 12,
            background: "rgba(249,115,22,0.04)",
            border: "1px solid rgba(249,115,22,0.15)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              🌐 커스텀 주소 설정
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
              나만의 서브도메인으로 앱을 공유하세요.
            </div>
            {subdomainSaved && savedSubdomain ? (
              <div style={{
                padding: "10px 12px", borderRadius: 8,
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
                fontSize: 12, color: "#22c55e", fontWeight: 600, wordBreak: "break-all",
              }}>
                ✅ <strong>https://{savedSubdomain}.fieldnine.io</strong> 로 설정되었습니다.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center",
                    background: "#1e293b", borderRadius: 8,
                    border: `1px solid ${subdomainError ? "rgba(239,68,68,0.4)" : T.border}`,
                    overflow: "hidden",
                  }}>
                    <input
                      type="text"
                      value={subdomainInput}
                      onChange={e => { setSubdomainInput(e.target.value); setSubdomainError(null); }}
                      onKeyDown={e => { if (e.key === "Enter") { void handleSubdomainSave(); } }}
                      placeholder="myapp"
                      maxLength={20}
                      style={{
                        flex: 1, background: "transparent", border: "none", outline: "none",
                        color: T.text, fontSize: 12, padding: "8px 10px", fontFamily: "monospace",
                      }}
                    />
                    <span style={{ fontSize: 11, color: T.muted, paddingRight: 10, flexShrink: 0 }}>
                      .fieldnine.io
                    </span>
                  </div>
                  <button
                    onClick={() => { void handleSubdomainSave(); }}
                    disabled={subdomainSaving || !subdomainInput.trim()}
                    style={{
                      padding: "8px 14px", borderRadius: 8, border: "none",
                      background: subdomainSaving || !subdomainInput.trim()
                        ? T.muted
                        : `linear-gradient(135deg,${T.accent},${T.accentB})`,
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: subdomainSaving || !subdomainInput.trim() ? "default" : "pointer",
                      fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap",
                    }}
                  >
                    {subdomainSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
                {subdomainError && (
                  <div style={{ marginTop: 5, fontSize: 10.5, color: "#ef4444" }}>
                    {subdomainError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Embed panel */}
        {showEmbed && slug && embedUrl && !isDataUrl && (
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 10 }}>크기 선택:</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {(Object.keys(EMBED_SIZES) as EmbedSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setEmbedSize(s)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                    border: "1px solid",
                    background: embedSize === s ? "#21262d" : "transparent",
                    borderColor: embedSize === s ? "#f97316" : "rgba(255,255,255,0.1)",
                    color: embedSize === s ? "#f97316" : "#8b949e",
                    fontFamily: "inherit",
                  }}
                >
                  {EMBED_SIZES[s].label} ({EMBED_SIZES[s].width}×{EMBED_SIZES[s].height})
                </button>
              ))}
            </div>
            <div style={{ background: "#0d1117", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <code style={{ color: "#79c0ff", fontSize: 10, wordBreak: "break-all", display: "block", lineHeight: 1.7, fontFamily: "monospace" }}>
                {iframeCode}
              </code>
            </div>
            <button
              onClick={copyEmbed}
              style={{
                width: "100%", background: embedCopied ? "#238636" : "#21262d",
                color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 8,
                padding: "9px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {embedCopied ? "✅ 복사됨!" : "📋 임베드 코드 복사"}
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: "#6e7681" }}>
              직접 보기:{" "}
              <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#f97316" }}>
                {embedUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
