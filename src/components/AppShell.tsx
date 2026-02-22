"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser, authSignOut, type AuthUser } from "@/utils/supabase/auth";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "대시보드" },
  { href: "/workspace",  label: "Studio" },
  { href: "/lm",         label: "LM 허브" },
  { href: "/flow",       label: "Flow" },
  { href: "/canvas",     label: "Canvas" },
  { href: "/collab",     label: "Collab" },
  { href: "/team",       label: "팀" },
  { href: "/cloud",      label: "클라우드" },
  { href: "/cowork",     label: "CoWork" },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [easterEgg, setEasterEgg] = useState(false);
  const logoClicksRef = useRef(0);
  const logoTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getAuthUser().then(u => setUser(u));
  }, []);

  // ── 기능 5: F9 로고 5번 연속 클릭 이스터에그 ─────────────────────────────
  const handleLogoClick = () => {
    logoClicksRef.current += 1;
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
    logoTimerRef.current = setTimeout(() => { logoClicksRef.current = 0; }, 2000);
    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0;
      setEasterEgg(true);
      setTimeout(() => setEasterEgg(false), 3500);
    }
  };

  const handleLogout = async () => {
    await authSignOut();
    setUser(null);
    router.push("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      color: "#1b1b1f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* ─── Top Nav ─────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", height: 56,
        padding: "0 24px", borderBottom: "1px solid #e5e7eb",
        background: "#fff", position: "sticky", top: 0, zIndex: 100,
        gap: 4,
      }}>
        {/* Logo */}
        <Link href="/" onClick={handleLogoClick} style={{
          display: "flex", alignItems: "center", gap: 8,
          fontWeight: 800, fontSize: 17, color: "#1b1b1f",
          textDecoration: "none", marginRight: 24, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
            transition: "transform 0.1s",
          }}>D</div>
          Dalkak
        </Link>

        {/* ── 기능 5: F9 이스터에그 오버레이 ── */}
        {easterEgg && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 99997, pointerEvents: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,20,0.82)",
            backdropFilter: "blur(4px)",
            animation: "fn-egg-in 3.5s ease-out forwards",
          }}>
            <div style={{
              fontSize: 80, marginBottom: 16,
              animation: "fn-egg-spin 0.6s ease-out",
            }}>🐣</div>
            <div style={{
              fontFamily: '"Pretendard", sans-serif',
              fontWeight: 900, fontSize: 36,
              color: "#f97316",
              textShadow: "0 0 40px rgba(249,115,22,0.9)",
              letterSpacing: "-0.5px",
              animation: "fn-egg-text 3.5s ease-out forwards",
            }}>
              딸깍이를 발견했다! 🖱️
            </div>
            <div style={{
              marginTop: 10, fontSize: 18, color: "#d4d8e2",
              fontFamily: '"Pretendard", sans-serif', fontWeight: 500,
            }}>
              F9을 5번 딸깍하면 나온다는 전설...
            </div>
          </div>
        )}
        <style>{`
          @keyframes fn-egg-in {
            0%   { opacity: 0; }
            10%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes fn-egg-spin {
            0%   { transform: scale(0) rotate(-180deg); }
            60%  { transform: scale(1.3) rotate(15deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes fn-egg-text {
            0%   { opacity: 0; transform: translateY(20px); }
            20%  { opacity: 1; transform: translateY(0); }
            80%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 14,
                fontWeight: active ? 600 : 500, textDecoration: "none",
                color: active ? "#f97316" : "#374151",
                background: active ? "#fff7ed" : "transparent",
                transition: "all 0.12s",
              }}>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: auth-aware */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/settings" style={{
            padding: "5px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600,
            color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}>
            ⚙️ API 설정
          </Link>

          {user ? (
            /* Logged in */
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1f" }}>{user.name}</span>
              <button onClick={handleLogout} style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                background: "#fff", fontSize: 13, color: "#6b7280", cursor: "pointer",
              }}>
                로그아웃
              </button>
            </div>
          ) : (
            /* Not logged in */
            <>
              <Link href="/login" style={{
                padding: "5px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb",
                background: "#fff",
              }}>
                로그인
              </Link>
              <Link href="/signup" style={{
                padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                color: "#fff", textDecoration: "none",
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              }}>
                시작하기 →
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── Page Content ─────────────────────────────── */}
      {children}
    </div>
  );
}
