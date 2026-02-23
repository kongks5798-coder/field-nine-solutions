'use client';

import { T } from '@/lib/theme';

export default function Footer() {
  const linkStyle: React.CSSProperties = {
    color: T.muted,
    fontSize: 12,
    textDecoration: 'none',
    transition: 'color 0.12s',
  };

  return (
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        height: 48,
        padding: '0 24px',
        borderTop: `1px solid ${T.border}`,
        background: T.bg,
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}
    >
      {/* Left */}
      <div style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
        &copy; 2026 Dalkak by FieldNine
      </div>

      {/* Center links */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <a
          href="/privacy"
          style={linkStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.muted;
          }}
        >
          개인정보처리방침
        </a>
        <a
          href="/terms"
          style={linkStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.muted;
          }}
        >
          이용약관
        </a>
        <a
          href="mailto:sales@fieldnine.io"
          style={linkStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = T.muted;
          }}
        >
          sales@fieldnine.io
        </a>
      </div>

      {/* Right badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 20,
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.2)',
          fontSize: 11,
          fontWeight: 600,
          color: T.accent,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 13 }}>&#x2728;</span>
        Powered by AI
      </div>
    </footer>
  );
}
