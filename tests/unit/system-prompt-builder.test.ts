import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, detectPlatformType } from '@/app/workspace/ai/systemPromptBuilder';

// ── Default options helper ───────────────────────────────────────────────────
const defaults = {
  autonomyLevel: 'medium',
  buildMode: 'fast',
  customSystemPrompt: '',
  hasExistingFiles: false,
};

// ── buildSystemPrompt ────────────────────────────────────────────────────────
describe('buildSystemPrompt', () => {
  it('includes the base system prompt with default options', () => {
    const result = buildSystemPrompt(defaults);
    expect(result).toContain('You are an elite senior web developer inside Dalkak IDE');
    expect(result).toContain('ABSOLUTE RULE #1');
    expect(result).toContain('ABSOLUTE RULE #2');
    expect(result).toContain('QUALITY STANDARDS');
  });

  it('includes EDIT mode instructions when hasExistingFiles=true', () => {
    const result = buildSystemPrompt({ ...defaults, hasExistingFiles: true });
    expect(result).toContain('EDIT MODE');
    expect(result).toContain('[EDIT:filename.ext]');
    expect(result).toContain('SEARCH block must match the EXACT code');
  });

  it('does NOT include EDIT mode instructions when hasExistingFiles=false', () => {
    const result = buildSystemPrompt({ ...defaults, hasExistingFiles: false });
    expect(result).not.toContain('EDIT MODE (preferred for modifying existing files');
    expect(result).not.toContain('SEARCH block must match the EXACT code');
  });

  it('prepends customSystemPrompt at the top when provided', () => {
    const custom = 'You are a Korean cooking assistant.';
    const result = buildSystemPrompt({ ...defaults, customSystemPrompt: custom });
    // customSystemPrompt should appear before the base prompt
    const customIdx = result.indexOf(custom);
    const baseIdx = result.indexOf('You are an elite senior web developer');
    expect(customIdx).toBeGreaterThanOrEqual(0);
    expect(baseIdx).toBeGreaterThan(customIdx);
  });

  it('does not prepend anything extra when customSystemPrompt is empty', () => {
    const result = buildSystemPrompt({ ...defaults, customSystemPrompt: '' });
    // The result should start with the base system prompt (no leading custom block)
    expect(result.startsWith('You are an elite senior web developer')).toBe(true);
  });

  // ── Autonomy level hints ──────────────────────────────────────────────────
  describe('autonomyLevel hints', () => {
    it('includes LOW autonomy hint', () => {
      const result = buildSystemPrompt({ ...defaults, autonomyLevel: 'low' });
      expect(result).toContain('[AUTONOMY: LOW]');
      expect(result).toContain('Be very conservative');
    });

    it('includes MEDIUM autonomy hint', () => {
      const result = buildSystemPrompt({ ...defaults, autonomyLevel: 'medium' });
      expect(result).toContain('[AUTONOMY: MEDIUM]');
      expect(result).toContain('Balance changes carefully');
    });

    it('includes HIGH autonomy hint', () => {
      const result = buildSystemPrompt({ ...defaults, autonomyLevel: 'high' });
      expect(result).toContain('[AUTONOMY: HIGH]');
      expect(result).toContain('Work confidently and autonomously');
    });

    it('includes MAX autonomy hint', () => {
      const result = buildSystemPrompt({ ...defaults, autonomyLevel: 'max' });
      expect(result).toContain('[AUTONOMY: MAX]');
      expect(result).toContain('Full autonomy');
    });

    it('falls back to MEDIUM for unknown autonomy level', () => {
      const result = buildSystemPrompt({ ...defaults, autonomyLevel: 'unknown' });
      expect(result).toContain('[AUTONOMY: MEDIUM]');
    });
  });

  // ── Build mode hints ──────────────────────────────────────────────────────
  describe('buildMode hints', () => {
    it('includes FAST build hint for buildMode="fast"', () => {
      const result = buildSystemPrompt({ ...defaults, buildMode: 'fast' });
      expect(result).toContain('[BUILD: FAST]');
      expect(result).toContain('Quick build');
    });

    it('includes FULL build hint for buildMode="full"', () => {
      const result = buildSystemPrompt({ ...defaults, buildMode: 'full' });
      expect(result).toContain('[BUILD: FULL]');
      expect(result).toContain('Perform a complete build');
    });

    it('falls back to FAST for unknown buildMode', () => {
      const result = buildSystemPrompt({ ...defaults, buildMode: 'whatever' });
      expect(result).toContain('[BUILD: FAST]');
    });
  });

  // ── Combined options ──────────────────────────────────────────────────────
  it('correctly combines all options at once', () => {
    const result = buildSystemPrompt({
      autonomyLevel: 'max',
      buildMode: 'full',
      customSystemPrompt: 'CUSTOM INSTRUCTION: only use Korean.',
      hasExistingFiles: true,
    });
    // Custom prompt present
    expect(result).toContain('CUSTOM INSTRUCTION: only use Korean.');
    // Base prompt present
    expect(result).toContain('You are an elite senior web developer inside Dalkak IDE');
    // EDIT mode present
    expect(result).toContain('EDIT MODE');
    // Autonomy hint present
    expect(result).toContain('[AUTONOMY: MAX]');
    // Build hint present
    expect(result).toContain('[BUILD: FULL]');

    // Verify ordering: custom < base < EDIT < autonomy < build
    const customIdx = result.indexOf('CUSTOM INSTRUCTION');
    const baseIdx = result.indexOf('You are an elite senior web developer');
    const editIdx = result.indexOf('EDIT MODE (preferred');
    const autonomyIdx = result.indexOf('[AUTONOMY: MAX]');
    const buildIdx = result.indexOf('[BUILD: FULL]');
    expect(customIdx).toBeLessThan(baseIdx);
    expect(baseIdx).toBeLessThan(editIdx);
    expect(editIdx).toBeLessThan(autonomyIdx);
    expect(autonomyIdx).toBeLessThan(buildIdx);
  });

  // ── Platform blueprint injection ────────────────────────────────────────
  describe('platform blueprint injection', () => {
    it('injects ecommerce blueprint when userPrompt mentions 쇼핑몰', () => {
      const result = buildSystemPrompt({ ...defaults, userPrompt: '무신사 스타일 쇼핑몰' });
      expect(result).toContain('E-COMMERCE');
      expect(result).toContain('Product Grid');
    });

    it('injects video blueprint when userPrompt mentions 유튜브', () => {
      const result = buildSystemPrompt({ ...defaults, userPrompt: '유튜브 클론 만들어줘' });
      expect(result).toContain('VIDEO PLATFORM');
    });

    it('injects social blueprint when userPrompt mentions 인스타', () => {
      const result = buildSystemPrompt({ ...defaults, userPrompt: '인스타 피드 만들기' });
      expect(result).toContain('SOCIAL MEDIA');
    });

    it('injects dashboard blueprint when userPrompt mentions 대시보드', () => {
      const result = buildSystemPrompt({ ...defaults, userPrompt: '관리자 대시보드' });
      expect(result).toContain('SaaS DASHBOARD');
    });

    it('does NOT inject blueprint for generic prompts', () => {
      const result = buildSystemPrompt({ ...defaults, userPrompt: '할일 앱 만들어줘' });
      expect(result).not.toContain('COMMERCIAL PLATFORM BLUEPRINT');
    });

    it('does NOT inject blueprint when userPrompt is not provided', () => {
      const result = buildSystemPrompt(defaults);
      expect(result).not.toContain('COMMERCIAL PLATFORM BLUEPRINT');
    });
  });
});

// ── detectPlatformType ───────────────────────────────────────────────────────
describe('detectPlatformType', () => {
  it('detects ecommerce from Korean keywords', () => {
    expect(detectPlatformType('무신사 스타일 쇼핑몰')).toBe('ecommerce');
    expect(detectPlatformType('이커머스 사이트')).toBe('ecommerce');
    expect(detectPlatformType('쿠팡 클론')).toBe('ecommerce');
  });

  it('detects ecommerce from English keywords', () => {
    expect(detectPlatformType('build an e-commerce site')).toBe('ecommerce');
    expect(detectPlatformType('online store')).toBe('ecommerce');
  });

  it('detects videoplatform', () => {
    expect(detectPlatformType('유튜브 클론')).toBe('videoplatform');
    expect(detectPlatformType('YouTube clone')).toBe('videoplatform');
    expect(detectPlatformType('동영상 플랫폼')).toBe('videoplatform');
  });

  it('detects socialmedia', () => {
    expect(detectPlatformType('인스타 피드')).toBe('socialmedia');
    expect(detectPlatformType('social media app')).toBe('socialmedia');
    expect(detectPlatformType('소셜미디어 앱')).toBe('socialmedia');
  });

  it('detects dashboard', () => {
    expect(detectPlatformType('관리자 대시보드')).toBe('dashboard');
    expect(detectPlatformType('admin dashboard')).toBe('dashboard');
    expect(detectPlatformType('어드민 페이지')).toBe('dashboard');
  });

  it('returns null for non-platform prompts', () => {
    expect(detectPlatformType('hello world')).toBeNull();
    expect(detectPlatformType('계산기 만들어줘')).toBeNull();
    expect(detectPlatformType('버튼 추가')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(detectPlatformType('')).toBeNull();
  });
});
