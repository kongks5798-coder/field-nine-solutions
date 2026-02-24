import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/app/workspace/ai/systemPromptBuilder';

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
});
