'use client';

import { T } from '@/lib/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export default function EmptyState({
  icon = '\uD83D\uDCED',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  const buttonStyle: React.CSSProperties = {
    display: 'inline-block',
    marginTop: 16,
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: T.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.12s',
    fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}
    >
      <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>
        {icon}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: T.text,
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            fontSize: 14,
            color: T.muted,
            marginTop: 8,
            lineHeight: 1.5,
            maxWidth: 320,
          }}
        >
          {description}
        </div>
      )}

      {actionLabel && actionHref && !onAction && (
        <a
          href={actionHref}
          style={buttonStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = '#ea580c';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = T.accent;
          }}
        >
          {actionLabel}
        </a>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={buttonStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#ea580c';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = T.accent;
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
