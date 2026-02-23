// @vitest-environment node
/**
 * Tests for collab utility pure functions (generateUserId, pickColor)
 * from src/lib/collab.ts
 */
import { describe, it, expect, vi } from 'vitest';

// Mock supabase client (collab.ts imports it at top level)
vi.mock('@/utils/supabase/client', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import { generateUserId, pickColor } from '@/lib/collab';

// ── generateUserId ──────────────────────────────────────────────────────────
describe('generateUserId', () => {
  it('u_ 접두사로 시작한다', () => {
    const id = generateUserId();
    expect(id).toMatch(/^u_/);
  });

  it('빈 문자열이 아니다', () => {
    const id = generateUserId();
    expect(id.length).toBeGreaterThan(2);
  });

  it('호출마다 고유한 ID를 생성한다', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUserId()));
    expect(ids.size).toBe(100);
  });

  it('타임스탬프와 랜덤 부분을 포함한다', () => {
    const id = generateUserId();
    // 형식: u_{timestamp}_{random}
    const parts = id.split('_');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('u');
  });

  it('랜덤 부분이 6자 이하이다', () => {
    const id = generateUserId();
    const parts = id.split('_');
    expect(parts[2].length).toBeLessThanOrEqual(6);
  });
});

// ── pickColor ───────────────────────────────────────────────────────────────
describe('pickColor', () => {
  it('유효한 hex 색상 코드를 반환한다', () => {
    const color = pickColor('test-user');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('동일한 userId에 대해 동일한 색상을 반환한다 (결정적)', () => {
    const color1 = pickColor('user-abc');
    const color2 = pickColor('user-abc');
    expect(color1).toBe(color2);
  });

  it('서로 다른 userId에 대해 다양한 색상을 반환한다', () => {
    const colors = new Set(
      Array.from({ length: 20 }, (_, i) => pickColor(`user-${i}`)),
    );
    // 7개의 팔레트 색상 중 최소 3가지 이상 사용
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it('빈 문자열에도 색상을 반환한다', () => {
    const color = pickColor('');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('긴 문자열에도 올바르게 동작한다', () => {
    const color = pickColor('a'.repeat(1000));
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('특수문자가 포함된 userId에도 동작한다', () => {
    const color = pickColor('user@example.com!#$%');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('반환값이 팔레트 색상 중 하나이다', () => {
    const palette = ['#3b82f6', '#8b5cf6', '#22c55e', '#f43f5e', '#14b8a6', '#eab308', '#ec4899'];
    const color = pickColor('any-user');
    expect(palette).toContain(color);
  });
});
