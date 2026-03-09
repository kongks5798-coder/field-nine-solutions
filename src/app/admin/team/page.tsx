"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { T } from "@/lib/theme";

type Plan = "team" | "pro";

const PLAN_OPTIONS: { value: Plan; label: string; desc: string; color: string }[] = [
  { value: "team", label: "팀", desc: "팀 협업 + AI 무제한 + 50GB", color: T.blue },
  { value: "pro",  label: "프로", desc: "AI 무제한 + 클라우드 20GB", color: T.accent },
];

export default function AdminTeamPage() {
  const [email,   setEmail]   = useState("");
  const [plan,    setPlan]    = useState<Plan>("team");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setResult({ ok: false, message: "이메일을 입력하세요." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/team-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, plan }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setResult({ ok: true, message: `${data.email}님을 ${plan === "team" ? "팀" : "프로"} 플랜으로 초대했습니다. 초대 이메일이 발송되었습니다.` });
        setEmail("");
      } else {
        setResult({ ok: false, message: data.error ?? "초대 실패. 다시 시도하세요." });
      }
    } catch {
      setResult({ ok: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      padding: "28px 32px",
      color: T.text,
      fontFamily: T.fontStack,
      maxWidth: 560,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: T.text }}>팀 초대</h1>
        <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
          사용자를 팀 또는 프로 플랜으로 업그레이드하고 초대 이메일을 발송합니다.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 24,
      }}>
        {/* Email input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setResult(null); }}
            onKeyDown={handleKeyDown}
            placeholder="user@example.com"
            disabled={loading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              borderRadius: 9,
              border: `1px solid ${T.border}`,
              background: T.surface,
              color: T.text,
              fontSize: 14,
              outline: "none",
              fontFamily: T.fontStack,
              opacity: loading ? 0.6 : 1,
            }}
          />
        </div>

        {/* Plan selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            플랜
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PLAN_OPTIONS.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  border: `1px solid ${plan === opt.value ? opt.color : T.border}`,
                  borderRadius: 9,
                  cursor: loading ? "default" : "pointer",
                  background: plan === opt.value ? `${opt.color}14` : "transparent",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="plan"
                  value={opt.value}
                  checked={plan === opt.value}
                  onChange={() => setPlan(opt.value)}
                  disabled={loading}
                  style={{ accentColor: opt.color, width: 16, height: 16 }}
                />
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: plan === opt.value ? 700 : 500,
                    color: plan === opt.value ? T.text : T.muted,
                  }}>
                    {opt.label} 플랜
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Feedback */}
        {result && (
          <div style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            background: result.ok ? "rgba(34,197,94,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${result.ok ? T.green : T.red}33`,
            color: result.ok ? T.green : T.red,
          }}>
            {result.message}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim()}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 9,
            border: "none",
            background: loading || !email.trim()
              ? T.border
              : `linear-gradient(135deg, ${T.blue} 0%, #a855f7 100%)`,
            color: loading || !email.trim() ? T.muted : "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: loading || !email.trim() ? "not-allowed" : "pointer",
            fontFamily: T.fontStack,
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {loading ? "초대 발송 중..." : "초대 발송"}
        </button>
      </div>

      {/* Info note */}
      <p style={{ fontSize: 11, color: T.muted, marginTop: 14, lineHeight: 1.6 }}>
        초대 시 해당 사용자의 플랜이 즉시 변경되고, 초대 안내 이메일이 발송됩니다.<br/>
        초대 대상 사용자는 반드시 Dalkak에 가입된 계정이어야 합니다.
      </p>
    </div>
  );
}
