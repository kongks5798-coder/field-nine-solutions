/**
 * 공통 UI 테마 상수 (다크 테마)
 * 모든 페이지에서 import해서 사용
 */
export const T = {
  bg:      '#07080f',
  surface: '#0d1020',
  card:    '#111827',
  border:  'rgba(255,255,255,0.08)',
  accent:  '#f97316',
  text:    '#e2e8f0',
  muted:   '#6b7280',
  red:     '#f87171',
  blue:    '#60a5fa',
  green:   '#22c55e',
  yellow:  '#fbbf24',
} as const;

export type ThemeColor = typeof T;
