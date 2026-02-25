"use client";

import { T, tokToUSD } from "./workspace.constants";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  publishedUrl: string;
  tokenBalance: number;
  showToast: (msg: string) => void;
}

export function PublishModal({ open, onClose, publishedUrl, tokenBalance, showToast }: PublishModalProps) {
  if (!open) return null;
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
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, width: 500, boxShadow: "0 28px 70px rgba(0,0,0,0.75)" }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">🚀</div>
        <div id="publish-title" style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>배포 완료!</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 1.7 }}>
          앱이 배포되었습니다. 아래 링크를 공유하면 누구든지 접근할 수 있습니다.<br />
          링크 안에 앱 데이터가 압축 포함되어 있어 별도 서버가 필요없습니다.
        </div>

        <div
          aria-label="배포된 앱 URL"
          style={{ background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 10, color: "#7a8098", wordBreak: "break-all", fontFamily: "monospace", maxHeight: 76, overflowY: "auto", lineHeight: 1.6 }}
        >
          {publishedUrl}
        </div>

        <div style={{ fontSize: 10, color: T.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: T.green }} aria-hidden="true">✓</span>
          토큰 잔액: <strong style={{ color: T.text }}>{tokToUSD(tokenBalance)}</strong>
          <span style={{ color: T.border }}>·</span>
          AI 사용 시 $0.05 ~ $5.95 차감됩니다
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(publishedUrl).catch(() => {}); showToast("🔗 URL 복사됨"); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            🔗 링크 복사
          </button>
          <button
            onClick={() => window.open(publishedUrl, "_blank")}
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
      </div>
    </div>
  );
}
