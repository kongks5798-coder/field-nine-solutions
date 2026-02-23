import { describe, it, expect } from 'vitest';
import {
  T,
  TOK_KEY,
  TOK_INIT,
  AI_HIST_KEY,
  PROJ_KEY,
  CUR_KEY,
  DEFAULT_FILES,
  CDN_PKGS,
  calcCost,
  tokToUSD,
} from '@/app/workspace/workspace.constants';

// ── localStorage key constants ───────────────────────────────────────────────
describe('localStorage key constants', () => {
  it('TOK_KEY is a non-empty string', () => {
    expect(typeof TOK_KEY).toBe('string');
    expect(TOK_KEY.length).toBeGreaterThan(0);
  });

  it('AI_HIST_KEY is a non-empty string', () => {
    expect(typeof AI_HIST_KEY).toBe('string');
    expect(AI_HIST_KEY.length).toBeGreaterThan(0);
  });

  it('PROJ_KEY is a non-empty string', () => {
    expect(typeof PROJ_KEY).toBe('string');
    expect(PROJ_KEY.length).toBeGreaterThan(0);
  });

  it('CUR_KEY is a non-empty string', () => {
    expect(typeof CUR_KEY).toBe('string');
    expect(CUR_KEY.length).toBeGreaterThan(0);
  });

  it('all storage keys are distinct', () => {
    const keys = [TOK_KEY, AI_HIST_KEY, PROJ_KEY, CUR_KEY];
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ── Token constants ──────────────────────────────────────────────────────────
describe('token constants', () => {
  it('TOK_INIT is a positive number', () => {
    expect(TOK_INIT).toBeGreaterThan(0);
    expect(Number.isInteger(TOK_INIT)).toBe(true);
  });

  it('TOK_INIT equals 50000', () => {
    expect(TOK_INIT).toBe(50000);
  });
});

// ── DEFAULT_FILES ────────────────────────────────────────────────────────────
describe('DEFAULT_FILES', () => {
  it('contains index.html, style.css, and script.js', () => {
    expect(DEFAULT_FILES).toHaveProperty('index.html');
    expect(DEFAULT_FILES).toHaveProperty('style.css');
    expect(DEFAULT_FILES).toHaveProperty('script.js');
  });

  it('each file has name, language, and content fields', () => {
    for (const [key, file] of Object.entries(DEFAULT_FILES)) {
      expect(file.name).toBe(key);
      expect(typeof file.language).toBe('string');
      expect(typeof file.content).toBe('string');
      expect(file.content.length).toBeGreaterThan(0);
    }
  });
});

// ── CDN_PKGS ─────────────────────────────────────────────────────────────────
describe('CDN_PKGS', () => {
  it('contains at least 5 packages', () => {
    expect(CDN_PKGS.length).toBeGreaterThanOrEqual(5);
  });

  it('every CDN url is a valid HTTPS URL', () => {
    for (const pkg of CDN_PKGS) {
      expect(() => new URL(pkg.url)).not.toThrow();
      expect(pkg.url).toMatch(/^https:\/\//);
    }
  });
});

// ── Theme object ─────────────────────────────────────────────────────────────
describe('theme constants (T)', () => {
  it('has accent colour set to #f97316', () => {
    expect(T.accent).toBe('#f97316');
  });

  it('all colour values are non-empty strings', () => {
    for (const [, value] of Object.entries(T)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ── Token helper functions ───────────────────────────────────────────────────
describe('calcCost', () => {
  it('returns increasing costs for longer prompts', () => {
    const short = calcCost('hi');
    const medium = calcCost('a'.repeat(500));
    const long = calcCost('a'.repeat(2000));
    const veryLong = calcCost('a'.repeat(6000));
    expect(short).toBeLessThan(medium);
    expect(medium).toBeLessThan(long);
    expect(long).toBeLessThan(veryLong);
  });
});

describe('tokToUSD', () => {
  it('formats 1000 tokens as $1.00', () => {
    expect(tokToUSD(1000)).toBe('$1.00');
  });

  it('formats 50000 tokens as $50.00', () => {
    expect(tokToUSD(50000)).toBe('$50.00');
  });
});
