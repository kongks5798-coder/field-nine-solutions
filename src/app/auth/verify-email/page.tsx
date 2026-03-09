"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on mount
  useEffect(() => { handleSend(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSend() {
    if (cooldown > 0 || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      setCooldown(60);
    } catch { setError("네트워크 오류가 발생했습니다."); }
    finally { setSending(false); }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) { setError("6자리 코드를 모두 입력해주세요."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "오류가 발생했습니다."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/workspace"), 1500);
    } catch { setError("네트워크 오류가 발생했습니다."); }
    finally { setLoading(false); }
  }

  function handleInput(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d)) {
      setTimeout(() => handleVerify(), 100);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      refs.current[5]?.focus();
    }
  }

  const s = {
    page: { minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" } as React.CSSProperties,
    card: { background: "#0b0b14", border: "1px solid #1f2937", borderRadius: 20, padding: "48px 40px", width: 420, maxWidth: "92vw", textAlign: "center" as const },
    title: { fontSize: 24, fontWeight: 800, color: "#f97316", marginBottom: 8 },
    sub: { fontSize: 14, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 },
    otpRow: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 },
    input: (focused: boolean) => ({
      width: 44, height: 56, borderRadius: 10, border: `2px solid ${focused ? "#f97316" : "#1f2937"}`,
      background: "#050508", color: "#f97316", fontSize: 24, fontWeight: 700, textAlign: "center" as const,
      outline: "none", transition: "border-color 0.15s", fontFamily: "monospace",
    }),
    btn: (disabled: boolean) => ({
      width: "100%", padding: "14px", borderRadius: 10, border: "none",
      background: disabled ? "#1f2937" : "linear-gradient(135deg,#f97316,#f43f5e)",
      color: disabled ? "#4b5563" : "#fff", fontSize: 15, fontWeight: 700,
      cursor: disabled ? "default" : "pointer", marginBottom: 16, fontFamily: "inherit",
    }),
    resend: { fontSize: 13, color: "#6b7280" },
    resendLink: { color: "#f97316", cursor: "pointer", fontWeight: 600 },
    error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 },
    success: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 13, marginBottom: 16 },
  };

  const [focused, setFocused] = useState<number | null>(null);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
        <div style={s.title}>이메일 인증</div>
        <div style={s.sub}>
          가입하신 이메일로 6자리 인증 코드를 발송했습니다.<br />
          코드를 입력해서 계정을 활성화해주세요.
        </div>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>✅ 인증 완료! 워크스페이스로 이동합니다...</div>}

        <div style={s.otpRow} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused(null)}
              style={s.input(focused === i)}
              disabled={success}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || success || otp.join("").length !== 6}
          style={s.btn(loading || success || otp.join("").length !== 6)}
        >
          {loading ? "인증 중..." : "인증하기"}
        </button>

        <div style={s.resend}>
          코드를 못 받으셨나요?{" "}
          {cooldown > 0 ? (
            <span style={{ color: "#4b5563" }}>{cooldown}초 후 재발송 가능</span>
          ) : (
            <span style={s.resendLink} onClick={handleSend}>
              {sending ? "발송 중..." : "다시 보내기"}
            </span>
          )}
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: "#374151" }}>
          <Link href="/workspace" style={{ color: "#4b5563" }}>나중에 인증하기 →</Link>
        </div>
      </div>
    </div>
  );
}
