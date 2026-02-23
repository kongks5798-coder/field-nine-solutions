'use client';

import { useEffect, useRef, useCallback } from 'react';
import { T } from '@/lib/theme';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap: keep focus inside dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, onCancel],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus cancel button on open
      setTimeout(() => cancelBtnRef.current?.focus(), 0);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const confirmBg = isDanger ? T.red : T.accent;
  const confirmHover = isDanger ? '#ef4444' : '#ea580c';

  return (
    <>
      <style>{`
        @keyframes cfd-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cfd-scale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'cfd-fade 0.15s ease',
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cfd-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '24px 28px',
            maxWidth: 400,
            width: '90vw',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            animation: 'cfd-scale 0.15s ease',
            fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
          }}
        >
          <h2
            id="cfd-title"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: T.text,
              lineHeight: 1.4,
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: '12px 0 24px',
              fontSize: 14,
              color: T.muted,
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              ref={cancelBtnRef}
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.surface,
                color: T.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = T.card;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = T.surface;
              }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: confirmBg,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = confirmHover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = confirmBg;
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
