import { describe, it, expect } from 'vitest';
import { applyDiffPatch, similarity } from '@/app/workspace/ai/diffApplicator';
import type { SearchReplaceBlock } from '@/app/workspace/ai/diffTypes';

// ── similarity() unit tests ─────────────────────────────────────────────────
describe('similarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(similarity('hello', 'hello')).toBe(1);
  });

  it('returns 1.0 for identical empty strings', () => {
    expect(similarity('', '')).toBe(1);
  });

  it('returns 0 when one string is empty and the other is not', () => {
    expect(similarity('', 'abc')).toBe(0);
    expect(similarity('abc', '')).toBe(0);
  });

  it('returns approximately 0 for completely different strings', () => {
    expect(similarity('aaaaaa', 'zzzzzz')).toBeLessThan(0.2);
  });

  it('returns a partial similarity for partially matching strings', () => {
    const sim = similarity('function hello()', 'function hallo()');
    expect(sim).toBeGreaterThan(0.8);
    expect(sim).toBeLessThan(1.0);
  });

  it('is symmetric: similarity(a, b) === similarity(b, a)', () => {
    const a = 'const x = 1;';
    const b = 'const y = 2;';
    expect(similarity(a, b)).toBe(similarity(b, a));
  });

  it('handles long strings (>2000 chars) via line-based heuristic', () => {
    const lineA = 'x'.repeat(50);
    const lineB = 'y'.repeat(50);
    // Create strings >2000 chars
    const a = Array(50).fill(lineA).join('\n');
    const b = Array(50).fill(lineA).join('\n');
    expect(a.length).toBeGreaterThan(2000);
    expect(similarity(a, b)).toBe(1);

    // Completely different long strings
    const c = Array(50).fill(lineB).join('\n');
    expect(similarity(a, c)).toBe(0);
  });
});

// ── applyDiffPatch() – exact match ─────────────────────────────────────────
describe('applyDiffPatch – exact match', () => {
  it('replaces an exact substring match', () => {
    const original = 'const x = 1;\nconst y = 2;\nconst z = 3;';
    const blocks: SearchReplaceBlock[] = [
      { search: 'const y = 2;', replace: 'const y = 42;' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.content).toBe('const x = 1;\nconst y = 42;\nconst z = 3;');
  });

  it('replaces multi-line exact matches', () => {
    const original = `function greet() {
  console.log("hello");
}`;
    const blocks: SearchReplaceBlock[] = [
      {
        search: `function greet() {
  console.log("hello");
}`,
        replace: `function greet(name: string) {
  console.log(\`hello \${name}\`);
}`,
      },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.content).toContain('name: string');
  });
});

// ── applyDiffPatch() – whitespace-normalized match ─────────────────────────
describe('applyDiffPatch – whitespace normalized match', () => {
  it('matches despite leading/trailing spaces and collapsed inner spaces', () => {
    const original = '  const   x  =  1;  \n  const   y  =  2;  ';
    const blocks: SearchReplaceBlock[] = [
      { search: 'const x = 1;\nconst y = 2;', replace: 'const x = 10;\nconst y = 20;' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(1);
    expect(result.content).toContain('const x = 10;');
  });

  it('matches when search has different indentation', () => {
    const original = '    if (true) {\n      doSomething();\n    }';
    const blocks: SearchReplaceBlock[] = [
      {
        search: 'if (true) {\n  doSomething();\n}',
        replace: 'if (false) {\n  doNothing();\n}',
      },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(1);
  });
});

// ── applyDiffPatch() – fuzzy match ─────────────────────────────────────────
describe('applyDiffPatch – fuzzy match', () => {
  it('matches lines with minor character differences (similarity > 0.8)', () => {
    const original = 'function calculateTotal(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}';
    // Slightly different: "calclateTotal" vs "calculateTotal", "itms" vs "items"
    const blocks: SearchReplaceBlock[] = [
      {
        search: 'function calclateTotal(itms) {\n  return itms.reduce((s, i) => s + i.price, 0);\n}',
        replace: 'function calculateTotal(items: Item[]) {\n  return items.reduce((s, i) => s + i.price, 0);\n}',
      },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(1);
    expect(result.content).toContain('Item[]');
  });
});

// ── applyDiffPatch() – match failure ───────────────────────────────────────
describe('applyDiffPatch – match failure', () => {
  it('reports failure when search text is not found at all', () => {
    const original = 'const a = 1;';
    const blocks: SearchReplaceBlock[] = [
      { search: 'completely different content that does not exist anywhere', replace: 'replacement' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(1);
    expect(result.appliedCount).toBe(0);
    expect(result.failedSearches).toHaveLength(1);
    // Content should remain unchanged
    expect(result.content).toBe(original);
  });

  it('truncates long failed search strings to 80 chars + "..."', () => {
    const original = 'short';
    const longSearch = 'a'.repeat(100);
    const blocks: SearchReplaceBlock[] = [
      { search: longSearch, replace: 'b' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(false);
    expect(result.failedSearches[0]).toHaveLength(83); // 80 + "..."
    expect(result.failedSearches[0]).toMatch(/\.\.\.$/);
  });
});

// ── applyDiffPatch() – multiple sequential blocks ──────────────────────────
describe('applyDiffPatch – multiple blocks applied sequentially', () => {
  it('applies multiple search/replace blocks in order', () => {
    const original = 'line1\nline2\nline3';
    const blocks: SearchReplaceBlock[] = [
      { search: 'line1', replace: 'LINE_ONE' },
      { search: 'line3', replace: 'LINE_THREE' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.content).toBe('LINE_ONE\nline2\nLINE_THREE');
  });

  it('later blocks see the result of earlier blocks', () => {
    const original = 'aaa bbb ccc';
    const blocks: SearchReplaceBlock[] = [
      { search: 'aaa', replace: 'xxx' },
      { search: 'xxx bbb', replace: 'yyy' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(2);
    expect(result.content).toBe('yyy ccc');
  });

  it('reports partial success when some blocks fail', () => {
    const original = 'keep this\nchange this';
    const blocks: SearchReplaceBlock[] = [
      { search: 'change this', replace: 'changed!' },
      { search: 'nonexistent block', replace: 'nope' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(false);
    expect(result.appliedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.content).toContain('changed!');
  });
});

// ── applyDiffPatch() – empty search/replace ────────────────────────────────
describe('applyDiffPatch – empty search/replace', () => {
  it('handles empty search string (no match found)', () => {
    const original = 'some content';
    const blocks: SearchReplaceBlock[] = [
      { search: '', replace: 'inserted' },
    ];
    const result = applyDiffPatch(original, blocks);
    // Empty string indexOf returns 0, so it is treated as exact match at position 0
    expect(result.appliedCount).toBe(1);
    expect(result.content.startsWith('inserted')).toBe(true);
  });

  it('handles empty replace string (deletion)', () => {
    const original = 'before DELETE_ME after';
    const blocks: SearchReplaceBlock[] = [
      { search: 'DELETE_ME ', replace: '' },
    ];
    const result = applyDiffPatch(original, blocks);
    expect(result.success).toBe(true);
    expect(result.content).toBe('before after');
  });

  it('returns unchanged content for empty blocks array', () => {
    const original = 'unchanged';
    const result = applyDiffPatch(original, []);
    expect(result.success).toBe(true);
    expect(result.appliedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.content).toBe(original);
  });
});
