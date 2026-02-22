import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeTime, formatKRW, formatBytes, toSlug } from '@/lib/utils';

// ── formatDate ──────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('null → "—"', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('undefined → "—"', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('빈 문자열 → "—"', () => {
    expect(formatDate('')).toBe('—');
  });

  it('유효한 날짜 문자열 → 한국어 포맷', () => {
    const result = formatDate('2025-03-15');
    // "2025년 3월 15일" 형태
    expect(result).toContain('2025');
    expect(result).toContain('3');
    expect(result).toContain('15');
  });

  it('Date 객체 → 한국어 포맷', () => {
    const result = formatDate(new Date('2025-12-25'));
    expect(result).toContain('2025');
    expect(result).toContain('12');
    expect(result).toContain('25');
  });

  it('ISO 날짜 문자열 → 한국어 포맷', () => {
    const result = formatDate('2025-01-01T00:00:00Z');
    expect(result).toContain('2025');
  });
});

// ── formatDateTime ──────────────────────────────────────────────────────────
describe('formatDateTime', () => {
  it('null → "—"', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('undefined → "—"', () => {
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('유효한 날짜 → 날짜+시간 포맷', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z');
    expect(result).toContain('2025');
  });
});

// ── formatRelativeTime ──────────────────────────────────────────────────────
describe('formatRelativeTime', () => {
  it('null → "—"', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('undefined → "—"', () => {
    expect(formatRelativeTime(undefined)).toBe('—');
  });

  it('방금 전 → "방금 전"', () => {
    const result = formatRelativeTime(new Date());
    expect(result).toBe('방금 전');
  });

  it('5분 전 → "5분 전"', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeTime(fiveMinAgo);
    expect(result).toContain('분 전');
  });

  it('3시간 전 → "3시간 전"', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(threeHoursAgo);
    expect(result).toContain('시간 전');
  });

  it('2일 전 → "2일 전"', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoDaysAgo);
    expect(result).toContain('일 전');
  });

  it('8일 전 → formatDate 결과 (날짜 포맷)', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(eightDaysAgo);
    // 7일 초과 시 formatDate로 폴백
    expect(result).not.toContain('일 전');
    expect(result).toContain('년');
  });
});

// ── formatKRW ───────────────────────────────────────────────────────────────
describe('formatKRW', () => {
  it('0 → "₩0"', () => {
    expect(formatKRW(0)).toBe('₩0');
  });

  it('39000 → "₩39,000"', () => {
    expect(formatKRW(39000)).toBe('₩39,000');
  });

  it('1000000 → "₩1,000,000"', () => {
    expect(formatKRW(1000000)).toBe('₩1,000,000');
  });

  it('음수 금액 → "₩-39,000"', () => {
    const result = formatKRW(-39000);
    expect(result).toContain('₩');
    expect(result).toContain('39,000');
  });

  it('소수점 → 로케일에 따라 처리', () => {
    const result = formatKRW(99.5);
    expect(result).toContain('₩');
  });
});

// ── formatBytes ─────────────────────────────────────────────────────────────
describe('formatBytes', () => {
  it('0 → "0 B"', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('500 → "500 B"', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('1023 → "1023 B"', () => {
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('1024 → "1.0 KB"', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('1536 → "1.5 KB"', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('1048576 (1MB) → "1.0 MB"', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('1572864 (1.5MB) → "1.5 MB"', () => {
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });

  it('1073741824 (1GB) → "1.0 GB"', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });

  it('경계값: 1024^2 - 1 → KB', () => {
    expect(formatBytes(1024 * 1024 - 1)).toContain('KB');
  });

  it('경계값: 1024^3 - 1 → MB', () => {
    expect(formatBytes(1024 ** 3 - 1)).toContain('MB');
  });
});

// ── toSlug ──────────────────────────────────────────────────────────────────
describe('toSlug', () => {
  it('영어 텍스트 → 소문자 슬러그', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('특수문자 제거', () => {
    expect(toSlug('Hello! @World#')).toBe('hello-world');
  });

  it('연속 공백 → 단일 하이픈', () => {
    expect(toSlug('Hello   World')).toBe('hello-world');
  });

  it('연속 하이픈 → 단일 하이픈', () => {
    expect(toSlug('hello---world')).toBe('hello-world');
  });

  it('한글 포함 → 한글 유지', () => {
    const result = toSlug('안녕 세계');
    expect(result).toBe('안녕-세계');
  });

  it('50자 초과 → 50자로 잘림', () => {
    const long = 'a'.repeat(100);
    expect(toSlug(long).length).toBe(50);
  });

  it('빈 문자열 → 빈 문자열', () => {
    expect(toSlug('')).toBe('');
  });

  it('숫자 포함 → 유지', () => {
    expect(toSlug('Project 123')).toBe('project-123');
  });

  it('대문자 → 소문자 변환', () => {
    expect(toSlug('MyProject')).toBe('myproject');
  });

  it('하이픈은 유지', () => {
    expect(toSlug('my-project')).toBe('my-project');
  });
});
