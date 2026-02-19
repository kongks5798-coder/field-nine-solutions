"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser, authSignOut, type AuthUser } from "@/utils/supabase/auth";

const NAV_ITEMS = [
  { href: "/workspace", label: "워크스페이스" },
  { href: "/team", label: "팀 Team" },
  { href: "/cloud", label: "클라우드 Cloud" },
  { href: "/cowork", label: "코워크 CoWork" },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getAuthUser().then(u => setUser(u));
  }, []);

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
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          fontWeight: 800, fontSize: 17, color: "#1b1b1f",
          textDecoration: "none", marginRight: 24, flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          FieldNine
        </Link>

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
