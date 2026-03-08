"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser, authSignOut, type AuthUser } from "@/utils/supabase/auth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import NotificationCenter from "@/components/NotificationCenter";

const THEME_KEY = "dalkak_theme";
type Theme = "dark" | "light";

const NAV_ITEMS = [
  { href: "/dashboard",      label: "대시보드" },
  { href: "/workspace",      label: "Studio" },
  { href: "/marketplace",    label: "마켓" },
  { href: "/lm",             label: "LM 허브" },
  { href: "/flow",           label: "Flow" },
  { href: "/canvas",         label: "Canvas" },
  { href: "/collab",         label: "Collab" },
  { href: "/team",           label: "팀" },
  { href: "/cloud",          label: "클라우드" },
  { href: "/cowork",         label: "CoWork" },
  { href: "/blog",           label: "블로그" },
  { href: "/announcements",  label: "공지사항" },
  { href: "/help",           label: "도움말" },
  { href: "/showcase",       label: "쇼케이스" },
  { href: "/lab",            label: "개발실" },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [easterEgg, setEasterEgg] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const logoClicksRef = useRef(0);
  const logoTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Theme toggle ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch { /* ignore */ }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  // Focus trap for mobile slide-out menu
  const mobileMenuRef = useFocusTrap(mobileMenuOpen);

  // Close mobile menu on Escape via focus trap custom event
  useEffect(() => {
    const el = mobileMenuRef.current;
    if (!el) return;
    const handleEscape = () => setMobileMenuOpen(false);
    el.addEventListener("focustrap-escape", handleEscape);
    return () => el.removeEventListener("focustrap-escape", handleEscape);
  }, [mobileMenuOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    getAuthUser().then(u => setUser(u));
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.onTrial && d.trialDaysLeft !== null) setTrialDaysLeft(d.trialDaysLeft); })
      .catch((err) => { console.error('[Dalkak]', err); });
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
      <nav aria-label="주 내비게이션" style={{
        display: "flex", alignItems: "center", height: 56,
        padding: isMobile ? "0 12px" : "0 24px", borderBottom: "1px solid #e5e7eb",
        background: "#fff", position: "sticky", top: 0, zIndex: 100,
        gap: 4,
      }}>
        {/* Hamburger button (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileMenuOpen}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 44, height: 44, borderRadius: 8,
              border: "1px solid #e5e7eb", background: mobileMenuOpen ? "#fff7ed" : "#fff",
              fontSize: 20, cursor: "pointer", flexShrink: 0, marginRight: 8,
              color: mobileMenuOpen ? "#f97316" : "#374151",
            }}
          >
            {mobileMenuOpen ? "\u2715" : "\u2630"}
          </button>
        )}

        {/* Logo */}
        <Link href="/" onClick={handleLogoClick} aria-label="Dalkak 홈으로" style={{
          display: "flex", alignItems: "center", gap: 8,
          fontWeight: 800, fontSize: 17, color: "#1b1b1f",
          textDecoration: "none", marginRight: isMobile ? "auto" : 24, flexShrink: 0,
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
              D를 5번 딸깍하면 나온다는 전설...
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

        {/* Nav links (desktop) */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} style={{
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
        )}

        {/* Right: auth-aware (desktop only) */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "\uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uC804\uD658" : "\uB2E4\uD06C \uBAA8\uB4DC\uB85C \uC804\uD658"}
              title={theme === "dark" ? "\uB77C\uC774\uD2B8 \uBAA8\uB4DC" : "\uB2E4\uD06C \uBAA8\uB4DC"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 8,
                border: "1px solid #e5e7eb", background: "transparent",
                fontSize: 18, cursor: "pointer", flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              {theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"}
            </button>

            {/* Notification center */}
            <NotificationCenter />

            {/* Trial countdown badge */}
            {trialDaysLeft !== null && (
              <button onClick={() => router.push("/pricing")} aria-label={`체험판 ${trialDaysLeft}일 남음 - 플랜 업그레이드`} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                color: trialDaysLeft <= 3 ? "#f87171" : "#f97316",
                background: trialDaysLeft <= 3 ? "rgba(248,113,113,0.1)" : "rgba(249,115,22,0.1)",
                border: `1px solid ${trialDaysLeft <= 3 ? "rgba(248,113,113,0.3)" : "rgba(249,115,22,0.3)"}`,
                cursor: "pointer",
              }}>
                ⏳ 체험 {trialDaysLeft}일
              </button>
            )}
            <Link href="/billing" aria-label="청구 페이지" style={{
              padding: "5px 10px", borderRadius: 7, fontSize: 13, fontWeight: 600,
              color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}>
              💳 청구
            </Link>
            <Link href="/settings" aria-label="API 설정" style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600,
              color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}>
              ⚙️ API 설정
            </Link>

            {user ? (
              /* Logged in */
              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                <Link href="/profile" aria-label="내 프로필" style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff", textDecoration: "none",
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </Link>
                <Link href="/profile" style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1f", textDecoration: "none" }}>{user.name}</Link>
                {showLogoutConfirm ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 8px", borderRadius: 8,
                    background: "#fff7ed", border: "1px solid #fed7aa",
                  }}>
                    <span style={{ fontSize: 12, color: "#92400e", whiteSpace: "nowrap" }}>로그아웃하시겠습니까?</span>
                    <button onClick={handleLogout} style={{
                      padding: "3px 10px", borderRadius: 5, border: "none",
                      background: "#f97316", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>확인</button>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{
                      padding: "3px 10px", borderRadius: 5, border: "1px solid #e5e7eb",
                      background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>취소</button>
                  </div>
                ) : (
                  <button onClick={() => setShowLogoutConfirm(true)} aria-label="로그아웃" style={{
                    padding: "5px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                    background: "#fff", fontSize: 13, color: "#6b7280", cursor: "pointer",
                  }}>
                    로그아웃
                  </button>
                )}
              </div>
            ) : (
              /* Not logged in */
              <>
                <Link href="/login" aria-label="로그인" style={{
                  padding: "5px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                  color: "#374151", textDecoration: "none", border: "1px solid #e5e7eb",
                  background: "#fff",
                }}>
                  로그인
                </Link>
                <Link href="/signup" aria-label="회원가입 - 무료로 시작하기" style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                  color: "#fff", textDecoration: "none",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                }}>
                  시작하기 →
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ─── Mobile slide-out menu ───────────────────── */}
      {isMobile && mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed", inset: 0, top: 56, zIndex: 99,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}
      {isMobile && (
        <div ref={mobileMenuRef} role="navigation" aria-label="\uBAA8\uBC14\uC77C \uBA54\uB274" style={{
          position: "fixed", top: 56, left: 0, bottom: 0,
          width: 260, background: "#fff", zIndex: 100,
          borderRight: "1px solid #e5e7eb",
          transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease-in-out",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
          boxShadow: mobileMenuOpen ? "4px 0 20px rgba(0,0,0,0.15)" : "none",
        }}>
          {/* Close button + header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderBottom: "1px solid #e5e7eb",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1b1b1f" }}>
              {"\uBA54\uB274"}
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label={"\uBA54\uB274 \uB2EB\uAE30"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 6,
                border: "1px solid #e5e7eb", background: "#f9fafb",
                fontSize: 16, cursor: "pointer", color: "#6b7280",
              }}
            >
              {"\u2715"}
            </button>
          </div>

          {/* Nav links */}
          <div style={{ padding: "12px 8px", borderBottom: "1px solid #e5e7eb" }}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} style={{
                  display: "flex", alignItems: "center", minHeight: 44,
                  padding: "10px 16px", borderRadius: 8, fontSize: 15,
                  fontWeight: active ? 700 : 500, textDecoration: "none",
                  color: active ? "#f97316" : "#374151",
                  background: active ? "#fff7ed" : "transparent",
                  transition: "all 0.12s", marginBottom: 2,
                }}>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Theme toggle (mobile) */}
          <div style={{ padding: "8px 8px 0" }}>
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "\uB77C\uC774\uD2B8 \uBAA8\uB4DC\uB85C \uC804\uD658" : "\uB2E4\uD06C \uBAA8\uB4DC\uB85C \uC804\uD658"}
              style={{
                display: "flex", alignItems: "center", minHeight: 44,
                padding: "10px 16px", borderRadius: 8, fontSize: 14,
                fontWeight: 500, color: "#374151", width: "100%",
                border: "1px solid #e5e7eb", background: "#f9fafb",
                cursor: "pointer", fontFamily: "inherit", gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{theme === "dark" ? "\uD83C\uDF19" : "\u2600\uFE0F"}</span>
              {theme === "dark" ? "\uB77C\uC774\uD2B8 \uBAA8\uB4DC" : "\uB2E4\uD06C \uBAA8\uB4DC"}
            </button>
          </div>

          {/* Utility links */}
          <div style={{ padding: "12px 8px", borderBottom: "1px solid #e5e7eb" }}>
            {trialDaysLeft !== null && (
              <button onClick={() => { router.push("/pricing"); setMobileMenuOpen(false); }} aria-label={`체험판 ${trialDaysLeft}일 남음`} style={{
                display: "block", width: "100%", padding: "10px 16px", borderRadius: 8,
                fontSize: 13, fontWeight: 600, textAlign: "left",
                color: trialDaysLeft <= 3 ? "#f87171" : "#f97316",
                background: trialDaysLeft <= 3 ? "rgba(248,113,113,0.06)" : "rgba(249,115,22,0.06)",
                border: "none", cursor: "pointer", marginBottom: 2,
              }}>
                ⏳ 체험 {trialDaysLeft}일 남음
              </button>
            )}
            <Link href="/billing" aria-label="청구 페이지" style={{
              display: "flex", alignItems: "center", minHeight: 44,
              padding: "10px 16px", borderRadius: 8, fontSize: 14,
              fontWeight: 500, color: "#374151", textDecoration: "none", marginBottom: 2,
            }}>
              💳 청구
            </Link>
            <Link href="/settings" aria-label="API 설정" style={{
              display: "flex", alignItems: "center", minHeight: 44,
              padding: "10px 16px", borderRadius: 8, fontSize: 14,
              fontWeight: 500, color: "#374151", textDecoration: "none", marginBottom: 2,
            }}>
              ⚙️ API 설정
            </Link>
            <Link href="/profile" aria-label="내 프로필" style={{
              display: "flex", alignItems: "center", minHeight: 44,
              padding: "10px 16px", borderRadius: 8, fontSize: 14,
              fontWeight: 500, color: "#374151", textDecoration: "none", marginBottom: 2,
            }}>
              👤 프로필
            </Link>
          </div>

          {/* Auth section */}
          <div style={{ padding: "12px 8px", marginTop: "auto" }}>
            {user ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link href="/profile" aria-label="내 프로필" style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, textDecoration: "none",
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Link>
                  <Link href="/profile" style={{ fontSize: 14, fontWeight: 600, color: "#1b1b1f", flex: 1, textDecoration: "none" }}>{user.name}</Link>
                </div>
                {showLogoutConfirm ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 10px", borderRadius: 8,
                    background: "#fff7ed", border: "1px solid #fed7aa",
                  }}>
                    <span style={{ fontSize: 12, color: "#92400e", flex: 1 }}>로그아웃하시겠습니까?</span>
                    <button onClick={handleLogout} style={{
                      padding: "4px 12px", borderRadius: 5, border: "none",
                      background: "#f97316", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>확인</button>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{
                      padding: "4px 12px", borderRadius: 5, border: "1px solid #e5e7eb",
                      background: "#fff", color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>취소</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href="/profile" style={{
                      flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 7,
                      fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none",
                      border: "1px solid #e5e7eb", background: "#f9fafb",
                    }}>
                      프로필
                    </Link>
                    <button onClick={() => setShowLogoutConfirm(true)} aria-label="로그아웃" style={{
                      flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid #e5e7eb",
                      background: "#fff", fontSize: 13, fontWeight: 600, color: "#6b7280", cursor: "pointer",
                    }}>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, padding: "4px 8px" }}>
                <Link href="/login" aria-label="로그인" style={{
                  flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 8, fontSize: 14,
                  fontWeight: 600, color: "#374151", textDecoration: "none",
                  border: "1px solid #e5e7eb", background: "#fff",
                }}>
                  로그인
                </Link>
                <Link href="/signup" aria-label="회원가입" style={{
                  flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 8, fontSize: 14,
                  fontWeight: 600, color: "#fff", textDecoration: "none",
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                }}>
                  시작하기
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Page Content ─────────────────────────────── */}
      {children}
    </div>
  );
}
