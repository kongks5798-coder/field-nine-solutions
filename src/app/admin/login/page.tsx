"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, otp }),
    });
    if (resp.ok) {
      window.location.href = "/admin";
    } else {
      const data = await resp.json().catch(() => ({}));
      setError(data?.error || "로그인 실패");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="max-w-sm w-full p-8 rounded-[28px] glass-panel"
      >
        <h1 className="text-2xl font-semibold tracking-tight">관리자 로그인</h1>
        <p className="mt-2 text-sm opacity-80">보안 비밀번호를 입력하세요</p>
        <input
          type="password"
          className="mt-6 w-full h-11 px-4 rounded-lg border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <input
          type="password"
          className="mt-3 w-full h-11 px-4 rounded-lg border border-black/10 dark:border-white/15 bg-white/70 dark:bg-black/40"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="2차 인증 코드 (옵션)"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-background hover:opacity-90 disabled:opacity-50 w-full"
          disabled={loading || !password}
        >
          {loading ? "인증 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
