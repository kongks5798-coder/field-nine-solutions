'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { T } from '@/lib/theme';

interface UserMenuProps {
  user: { email: string; name?: string };
  plan?: string;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { icon: '\uD83D\uDC64', label: '\uB0B4 \uD504\uB85C\uD544', href: '/profile' },
  { icon: '\u2699\uFE0F', label: '\uC124\uC815', href: '/settings' },
  { icon: '\uD83D\uDCB3', label: '\uACB0\uC81C \uAD00\uB9AC', href: '/billing' },
];

const FONT = '"Pretendard", Inter, -apple-system, sans-serif';
const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const divider: React.CSSProperties = { height: 1, background: T.border, margin: '4px 0' };

const itemBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '8px 14px', border: 'none', background: 'transparent',
  color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  textDecoration: 'none', borderRadius: 6, transition: 'background 0.1s',
  fontFamily: FONT, textAlign: 'left' as const,
};

export default function UserMenu({ user, plan, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const onOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open, onOutside]);

  const hover = (bg: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = bg; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = 'transparent'; },
  });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <style>{`@keyframes um-open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true" aria-expanded={open} aria-label="사용자 메뉴"
        style={{
          width: 34, height: 34, borderRadius: '50%', padding: 0,
          border: `2px solid ${open ? T.accent : T.border}`,
          background: `linear-gradient(135deg, ${T.accent} 0%, #f43f5e 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          cursor: 'pointer', transition: 'border-color 0.12s',
        }}
      >
        {initial}
      </button>

      {/* Dropdown */}
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220,
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          padding: '6px 0', animation: 'um-open 0.12s ease', fontFamily: FONT,
        }}>
          {/* User info */}
          <div style={{ padding: '10px 14px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, ...ellipsis }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2, ...ellipsis }}>
              {user.email}
            </div>
            {plan && (
              <div style={{
                display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 12,
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                fontSize: 11, fontWeight: 600, color: T.accent,
              }}>
                {plan} 플랜
              </div>
            )}
          </div>

          <div style={divider} />

          {/* Menu items */}
          <div style={{ padding: '4px 6px' }}>
            {MENU_ITEMS.map(item => (
              <a key={item.href} href={item.href} role="menuitem"
                style={itemBase} {...hover(T.surface)}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          <div style={divider} />

          {/* Logout */}
          <div style={{ padding: '4px 6px' }}>
            <button role="menuitem"
              onClick={() => { setOpen(false); onLogout(); }}
              style={{ ...itemBase, color: T.red }}
              {...hover('rgba(248,113,113,0.08)')}>
              <span style={{ fontSize: 15 }}>{'\uD83D\uDEAA'}</span>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
