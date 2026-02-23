// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('CSRF_SECRET', 'test-csrf-extended-secret');

const { generateCsrfToken, validateCsrfToken } = await import('@/lib/csrf');

describe('CSRF extended edge cases', () => {
  it('token with only 2 parts is rejected', () => {
    expect(validateCsrfToken('part1.part2')).toBe(false);
  });

  it('token with 4 parts is rejected', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token + '.extra')).toBe(false);
  });

  it('token with tampered random portion is rejected', () => {
    const token = generateCsrfToken();
    const parts = token.split('.');
    const tampered = parts[1][0] === 'a' ? 'b' + parts[1].slice(1) : 'a' + parts[1].slice(1);
    parts[1] = tampered;
    expect(validateCsrfToken(parts.join('.'))).toBe(false);
  });

  it('token with tampered timestamp portion is rejected', () => {
    const token = generateCsrfToken();
    const parts = token.split('.');
    parts[0] = 'zzzzzz';
    expect(validateCsrfToken(parts.join('.'))).toBe(false);
  });

  it('freshly generated tokens always pass validation', () => {
    for (let i = 0; i < 5; i++) {
      const t = generateCsrfToken();
      expect(validateCsrfToken(t)).toBe(true);
    }
  });

  it('token with correct structure but wrong signature length is rejected', () => {
    const token = generateCsrfToken();
    const parts = token.split('.');
    parts[2] = parts[2].slice(0, -1);
    expect(validateCsrfToken(parts.join('.'))).toBe(false);
  });

  it('whitespace-only and dot-only inputs return false', () => {
    expect(validateCsrfToken('   ')).toBe(false);
    expect(validateCsrfToken('...')).toBe(false);
  });
});
