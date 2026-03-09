"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { T } from "@/lib/theme";

type Target = "all" | "pro" | "team" | "free";

const TARGET_OPTIONS: { value: Target; label: string }[] = [
  { value: "all",  label: "전체 유저" },
  { value: "free", label: "무료 유저" },
  { value: "pro",  label: "프로" },
  { value: "team", label: "팀" },
];

type Tab = "compose" | "preview";

export default function AdminNewsletterPage() {
  const [tab,      setTab]      = useState<Tab>("compose");
  const [subject,  setSubject]  = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [target,   setTarget]   = useState<Target>("all");
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState<{ ok: boolean; sent?: number; failed?: number; error?: string } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !htmlBody.trim()) {
      alert("제목과 본문을 모두 입력해주세요.");
      return;
    }
    const targetLabel = TARGET_OPTIONS.find(o => o.value === target)?.label ?? target;
    const confirmed = window.confirm(
      `정말로 [${targetLabel}]에게 뉴스레터를 발송하시겠습니까?\n\n실제 이메일이 즉시 발송됩니다.`
    );
    if (!confirmed) return;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: htmlBody, target }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: json.error ?? "발송 실패" });
      } else {
        setResult({ ok: true, sent: json.sent, failed: json.failed });
      }
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "네트워크 오류" });
    } finally {
      setSending(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    color: active ? T.accent : T.muted,
    background: "transparent",
    border: "none",
    borderBottom: `2px solid ${active ? T.accent : "transparent"}`,
    cursor: "pointer",
    transition: "color 0.15s",
  });

  return (
    <div style={{ padding: "28px 32px", color: T.text, fontFamily: T.fontStack, maxWidth: 860 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>뉴스레터 발송</h1>
        <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>
          전체 또는 특정 플랜 유저에게 일괄 이메일을 발송합니다
        </p>
      </div>

      {/* 경고 배너 */}
      <div style={{
        background: "rgba(248,113,113,0.08)",
        border: `1px solid rgba(248,113,113,0.3)`,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        color: T.red,
        fontWeight: 600,
      }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        실제 이메일이 발송됩니다. 신중하게 확인 후 발송하세요.
      </div>

      {/* 타겟 선택 */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          수신 대상
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TARGET_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTarget(opt.value)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: `1px solid ${target === opt.value ? T.accent : T.border}`,
                background: target === opt.value ? "rgba(249,115,22,0.1)" : "transparent",
                color: target === opt.value ? T.accent : T.muted,
                fontSize: 13,
                fontWeight: target === opt.value ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 입력 */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          제목
        </div>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="이메일 제목을 입력하세요..."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.surface,
            color: T.text,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 탭 + 본문 */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        {/* 탭 헤더 */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, paddingLeft: 8 }}>
          <button style={tabStyle(tab === "compose")} onClick={() => setTab("compose")}>작성</button>
          <button style={tabStyle(tab === "preview")} onClick={() => setTab("preview")}>미리보기</button>
        </div>

        {/* 탭 콘텐츠 */}
        {tab === "compose" ? (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              HTML 본문
            </div>
            <textarea
              value={htmlBody}
              onChange={e => setHtmlBody(e.target.value)}
              placeholder="<h1>안녕하세요!</h1>\n<p>본문 내용을 HTML로 작성하세요.</p>"
              rows={18}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.text,
                fontSize: 13,
                fontFamily: '"Fira Code", "Cascadia Code", monospace',
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              렌더링 미리보기
            </div>
            {htmlBody.trim() ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 8,
                  padding: 24,
                  minHeight: 200,
                  border: `1px solid ${T.border}`,
                }}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            ) : (
              <div style={{ color: T.muted, fontSize: 13, padding: "40px 0", textAlign: "center" }}>
                작성 탭에서 HTML을 입력하면 여기에 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 10,
          marginBottom: 16,
          background: result.ok ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
          border: `1px solid ${result.ok ? "rgba(34,197,94,0.3)" : "rgba(248,113,113,0.3)"}`,
          fontSize: 14,
          color: result.ok ? T.green : T.red,
          fontWeight: 600,
        }}>
          {result.ok
            ? `✅ ${result.sent}명에게 발송 완료${result.failed ? ` (실패 ${result.failed}명)` : ""}`
            : `❌ 발송 실패: ${result.error}`}
        </div>
      )}

      {/* 발송 버튼 */}
      <button
        onClick={handleSend}
        disabled={sending || !subject.trim() || !htmlBody.trim()}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          background: sending || !subject.trim() || !htmlBody.trim()
            ? T.border
            : `linear-gradient(135deg, #f97316, #f43f5e)`,
          color: sending || !subject.trim() || !htmlBody.trim() ? T.muted : "#fff",
          fontSize: 15,
          fontWeight: 800,
          cursor: sending || !subject.trim() || !htmlBody.trim() ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.02em",
        }}
      >
        {sending ? "발송 중..." : "뉴스레터 발송"}
      </button>
    </div>
  );
}
