// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { classifyError, severityEmoji } from '@/lib/error-severity';
import type { ErrorSeverity } from '@/lib/error-severity';

describe('classifyError extended edge cases', () => {
  it('accepts Error objects not just strings', () => {
    const result = classifyError(new Error('payment processing failed'));
    expect(result.severity).toBe('critical');
    expect(result.category).toBe('payment');
    expect(result.message).toBe('payment processing failed');
  });

  it('preserves context object when provided', () => {
    const ctx = { userId: '123', endpoint: '/checkout' };
    const result = classifyError('stripe error', ctx);
    expect(result.context).toEqual(ctx);
    expect(result.severity).toBe('critical');
  });

  it('context is undefined when not provided', () => {
    const result = classifyError('some info message');
    expect(result.context).toBeUndefined();
  });

  it('case-insensitive matching PAYMENT FAILED is critical', () => {
    const result = classifyError('PAYMENT FAILED');
    expect(result.severity).toBe('critical');
    expect(result.category).toBe('payment');
  });

  it('Supabase connection is critical db', () => {
    const result = classifyError('supabase connection pool exhausted');
    expect(result.severity).toBe('critical');
    expect(result.category).toBe('db');
  });

  it('jwt expired is error auth with shouldAlert true', () => {
    const result = classifyError('jwt expired for user session');
    expect(result.severity).toBe('error');
    expect(result.category).toBe('auth');
    expect(result.shouldAlert).toBe(true);
  });

  it('OpenAI error is error api', () => {
    const result = classifyError('openai rate limit exceeded');
    expect(result.severity).toBe('error');
    expect(result.category).toBe('api');
  });

  it('zod validation is warning client', () => {
    const result = classifyError('zod schema parse failed');
    expect(result.severity).toBe('warning');
    expect(result.category).toBe('client');
    expect(result.shouldAlert).toBe(false);
  });

  it('too many requests is warning infra', () => {
    const result = classifyError('too many requests from IP');
    expect(result.severity).toBe('warning');
    expect(result.category).toBe('infra');
  });

  it('empty string falls to catch-all info', () => {
    const result = classifyError('');
    expect(result.severity).toBe('info');
    expect(result.category).toBe('client');
    expect(result.shouldAlert).toBe(false);
  });
});

describe('severityEmoji extended', () => {
  it('returns correct emoji for all four severity levels', () => {
    const expected: Record<ErrorSeverity, string> = {
      critical: '\uD83D\uDD34',
      error: '\uD83D\uDFE0',
      warning: '\uD83D\uDFE1',
      info: '\uD83D\uDD35',
    };
    for (const [sev, emoji] of Object.entries(expected)) {
      expect(severityEmoji(sev as ErrorSeverity)).toBe(emoji);
    }
  });

  it('each severity level maps to a distinct emoji', () => {
    const levels: ErrorSeverity[] = ['critical', 'error', 'warning', 'info'];
    const emojis = levels.map(severityEmoji);
    const unique = new Set(emojis);
    expect(unique.size).toBe(4);
  });
});
