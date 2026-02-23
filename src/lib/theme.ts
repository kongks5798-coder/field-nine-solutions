/**
 * 공통 UI 테마 상수 (다크 테마)
 * 모든 페이지에서 import해서 사용
 */
export const T = {
  bg:         '#07080f',
  surface:    '#0d1020',
  card:       '#111827',
  border:     '#1e293b',
  accent:     '#f97316',
  accentPink: '#f43f5e',
  gradient:   'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
  text:       '#e8eaf0',
  textMuted:  '#9ca3af',
  muted:      '#6b7280',
  red:        '#f87171',
  blue:       '#60a5fa',
  green:      '#22c55e',
  yellow:     '#fbbf24',
  fontStack:  '"Pretendard", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
} as const;

export type ThemeColor = typeof T;
