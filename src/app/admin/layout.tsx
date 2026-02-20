'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'authed' | 'unauthed'>('checking');

  useEffect(() => {
    if (pathname === '/admin/login') {
      setState('authed');
      return;
    }
    // Verify via httpOnly JWT cookie — not localStorage
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
        background: '#0e1117', color: '#8b949e', fontSize: 14,
      }}>
        로딩 중...
      </div>
    );
  }

  if (state === 'unauthed') return null;

  return <>{children}</>;
}
