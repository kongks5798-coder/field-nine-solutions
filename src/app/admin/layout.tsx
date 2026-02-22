'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { T } from '@/lib/theme';

const NAV = [
  { href: '/admin',               icon: '⬡', label: '개요' },
  { href: '/admin/users',         icon: '👥', label: '사용자' },
  { href: '/admin/subscriptions', icon: '💳', label: '구독' },
  { href: '/admin/billing',       icon: '📊', label: '결제 이벤트' },
  { href: '/admin/audit',         icon: '🔍', label: '감사 로그' },
  { href: '/admin/revenue',       icon: '📈', label: '매출 분석' },
];

function Sidebar({ pathname }: { pathname: string }) {
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside style={{
      width: 200,
      minHeight: '100vh',
      background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.accent, letterSpacing: '-0.02em' }}>
            Dalkak
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>관리자</div>
        </Link>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {NAV.map(({ href, icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? T.text : T.muted,
                background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
                borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Home link */}
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.border}` }}>
        <Link href="/" style={{ textDecoration: 'none', fontSize: 12, color: T.muted }}>
          ← 홈으로
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [state, setState] = useState<'checking' | 'authed' | 'unauthed'>('checking');

  useEffect(() => {
    if (pathname === '/admin/login') {
      setState('authed');
      return;
    }
    fetch('/api/admin/verify', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          setState('authed');
        } else {
          setState('unauthed');
          router.replace('/admin/login');
        }
      })
      .catch(() => {
        setState('unauthed');
        router.replace('/admin/login');
      });
  }, [pathname, router]);

  if (state === 'checking') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.bg, color: T.muted, fontSize: 14,
      }}>
        로딩 중...
      </div>
    );
  }

  if (state === 'unauthed') return null;

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"Pretendard", Inter, sans-serif' }}>
      <Sidebar pathname={pathname ?? ""} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
