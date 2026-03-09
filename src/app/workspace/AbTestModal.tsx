"use client";
import { useState } from 'react';
import { T } from './workspace.constants';
import type { AbVersion } from './ai/abTest';

interface Props {
  prompt: string;
  versionA: AbVersion;
  versionB: AbVersion;
  onSelect: (winner: 'A' | 'B') => void;
  onClose: () => void;
}

export function AbTestModal({ prompt, versionA, versionB, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);

  const renderPreview = (v: AbVersion, label: 'A' | 'B') => {
    const html = v.files['index.html'] ?? '';
    const css = v.files['style.css'] ?? '';
    const js = v.files['script.js'] ?? '';
    const combined = html
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `<script>${js}</script></body>`);
    const isSelected = selected === label;

    return (
      <div style={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        border: `2px solid ${isSelected ? T.accent : T.border}`,
        borderRadius: 12, overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}>
        {/* Version header */}
        <div style={{
          padding: '10px 14px', background: T.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? T.accent : T.text }}>
              버전 {label}
            </span>
            <span style={{ fontSize: 11, color: T.muted }}>{v.modelLabel}</span>
          </div>
          {v.status === 'generating' && (
            <span style={{ fontSize: 11, color: T.muted }}>생성 중...</span>
          )}
          {v.status === 'done' && (
            <button
              onClick={() => setSelected(label)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${isSelected ? T.accent : T.border}`,
                background: isSelected ? `${T.accent}22` : 'transparent',
                color: isSelected ? T.accent : T.muted,
                cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              {isSelected ? '✓ 선택됨' : '이 버전 선택'}
            </button>
          )}
          {v.status === 'error' && (
            <span style={{ fontSize: 11, color: T.red }}>생성 실패</span>
          )}
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, minHeight: 400 }}>
          {v.status === 'generating' ? (
            <div style={{
              height: '100%', minHeight: 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.muted, fontSize: 13, gap: 8,
            }}>
              <div style={{
                width: 16, height: 16, border: `2px solid ${T.border}`,
                borderTopColor: T.accent, borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', flexShrink: 0,
              }} />
              생성 중...
            </div>
          ) : v.status === 'error' ? (
            <div style={{
              height: '100%', minHeight: 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171', fontSize: 13,
            }}>
              생성 실패
            </div>
          ) : (
            <iframe
              srcDoc={combined}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: 400, display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-forms"
              title={`A/B 버전 ${label} 미리보기`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300,
        display: 'flex', flexDirection: 'column', padding: 20, gap: 16,
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
            ⚡ A/B 버전 비교
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            &ldquo;{prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt}&rdquo;
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selected && (
            <button
              onClick={() => { onSelect(selected); onClose(); }}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: T.accent, border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              버전 {selected} 적용
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px', borderRadius: 8,
              border: `1px solid rgba(255,255,255,0.2)`,
              background: 'transparent', color: 'rgba(255,255,255,0.6)',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* Two-column preview */}
      <div
        style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {renderPreview(versionA, 'A')}
        {renderPreview(versionB, 'B')}
      </div>
    </div>
  );
}
