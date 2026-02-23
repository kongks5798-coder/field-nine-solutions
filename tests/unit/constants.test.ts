import { describe, it, expect } from 'vitest';
import {
  OPENAI_API_BASE,
  ANTHROPIC_API_BASE,
  GEMINI_API_BASE,
  TOSS_API_BASE,
  XAI_API_BASE,
} from '@/lib/constants';

const ALL_CONSTANTS = {
  OPENAI_API_BASE,
  ANTHROPIC_API_BASE,
  GEMINI_API_BASE,
  TOSS_API_BASE,
  XAI_API_BASE,
};

describe('src/lib/constants — URL constants', () => {
  it.each(Object.entries(ALL_CONSTANTS))('%s is a valid HTTPS URL', (_name, url) => {
    expect(() => new URL(url)).not.toThrow();
    expect(url).toMatch(/^https:\/\//);
  });

  it('no base URL has a trailing slash', () => {
    for (const url of Object.values(ALL_CONSTANTS)) {
      expect(url.endsWith('/')).toBe(false);
    }
  });

  it('OPENAI_API_BASE points to api.openai.com/v1', () => {
    expect(OPENAI_API_BASE).toBe('https://api.openai.com/v1');
  });

  it('ANTHROPIC_API_BASE points to api.anthropic.com/v1', () => {
    expect(ANTHROPIC_API_BASE).toBe('https://api.anthropic.com/v1');
  });

  it('GEMINI_API_BASE points to generativelanguage.googleapis.com', () => {
    expect(GEMINI_API_BASE).toBe('https://generativelanguage.googleapis.com');
  });

  it('TOSS_API_BASE points to api.tosspayments.com/v1', () => {
    expect(TOSS_API_BASE).toBe('https://api.tosspayments.com/v1');
  });

  it('XAI_API_BASE points to api.x.ai/v1', () => {
    expect(XAI_API_BASE).toBe('https://api.x.ai/v1');
  });
});
