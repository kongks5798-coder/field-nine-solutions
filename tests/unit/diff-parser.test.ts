import { describe, it, expect } from 'vitest';
import { parseAiResponse } from '@/app/workspace/ai/diffParser';

// ── [FILE:] block parsing ───────────────────────────────────────────────────
describe('parseAiResponse – [FILE:] blocks', () => {
  it('parses a single [FILE:] block with trimmed content', () => {
    const input = `[FILE:index.html]
<h1>Hello</h1>
[/FILE]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('full-file');
    expect(result.fullFiles['index.html']).toBe('<h1>Hello</h1>');
    expect(result.diffs).toHaveLength(0);
  });

  it('parses multiple [FILE:] blocks', () => {
    const input = `[FILE:a.ts]
const a = 1;
[/FILE]
[FILE:b.ts]
const b = 2;
[/FILE]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('full-file');
    expect(Object.keys(result.fullFiles)).toHaveLength(2);
    expect(result.fullFiles['a.ts']).toBe('const a = 1;');
    expect(result.fullFiles['b.ts']).toBe('const b = 2;');
  });

  it('trims whitespace from filename and content', () => {
    const input = `[FILE: app.tsx ]
  content here
[/FILE]`;
    const result = parseAiResponse(input);
    expect(result.fullFiles['app.tsx']).toBe('content here');
  });
});

// ── [EDIT:] block parsing (SEARCH/REPLACE format) ──────────────────────────
describe('parseAiResponse – [EDIT:] blocks', () => {
  it('parses a single [EDIT:] block with one SEARCH/REPLACE pair', () => {
    const input = `[EDIT:main.ts]
<<<<<<< SEARCH
const old = true;
=======
const old = false;
>>>>>>> REPLACE
[/EDIT]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('diff');
    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].filename).toBe('main.ts');
    expect(result.diffs[0].searchBlocks).toHaveLength(1);
    expect(result.diffs[0].searchBlocks[0].search).toBe('const old = true;');
    expect(result.diffs[0].searchBlocks[0].replace).toBe('const old = false;');
  });

  it('parses multiple SEARCH/REPLACE blocks within one [EDIT:]', () => {
    const input = `[EDIT:utils.ts]
<<<<<<< SEARCH
function foo() {}
=======
function foo() { return 1; }
>>>>>>> REPLACE
<<<<<<< SEARCH
function bar() {}
=======
function bar() { return 2; }
>>>>>>> REPLACE
[/EDIT]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('diff');
    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].searchBlocks).toHaveLength(2);
    expect(result.diffs[0].searchBlocks[0].search).toBe('function foo() {}');
    expect(result.diffs[0].searchBlocks[0].replace).toBe('function foo() { return 1; }');
    expect(result.diffs[0].searchBlocks[1].search).toBe('function bar() {}');
    expect(result.diffs[0].searchBlocks[1].replace).toBe('function bar() { return 2; }');
  });

  it('trims whitespace from [EDIT:] filename', () => {
    const input = `[EDIT: src/index.ts ]
<<<<<<< SEARCH
a
=======
b
>>>>>>> REPLACE
[/EDIT]`;
    const result = parseAiResponse(input);
    expect(result.diffs[0].filename).toBe('src/index.ts');
  });
});

// ── Mixed mode (FILE + EDIT) ────────────────────────────────────────────────
describe('parseAiResponse – mixed mode', () => {
  it('returns type "mixed" when both FILE and EDIT blocks are present', () => {
    const input = `Here is the explanation.
[FILE:readme.md]
# README
[/FILE]
[EDIT:app.ts]
<<<<<<< SEARCH
let x = 1;
=======
let x = 2;
>>>>>>> REPLACE
[/EDIT]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('mixed');
    expect(Object.keys(result.fullFiles)).toHaveLength(1);
    expect(result.fullFiles['readme.md']).toBe('# README');
    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].filename).toBe('app.ts');
    expect(result.text).toBe('Here is the explanation.');
  });
});

// ── text-only ───────────────────────────────────────────────────────────────
describe('parseAiResponse – text-only', () => {
  it('returns text-only when no FILE/EDIT blocks exist', () => {
    const input = 'This is just a plain explanation with no code blocks.';
    const result = parseAiResponse(input);
    expect(result.type).toBe('text-only');
    expect(Object.keys(result.fullFiles)).toHaveLength(0);
    expect(result.diffs).toHaveLength(0);
    expect(result.text).toBe(input);
  });
});

// ── Empty string ────────────────────────────────────────────────────────────
describe('parseAiResponse – empty string', () => {
  it('returns text-only with empty text for an empty input', () => {
    const result = parseAiResponse('');
    expect(result.type).toBe('text-only');
    expect(Object.keys(result.fullFiles)).toHaveLength(0);
    expect(result.diffs).toHaveLength(0);
    expect(result.text).toBe('');
  });
});

// ── Plain text extraction ───────────────────────────────────────────────────
describe('parseAiResponse – plain text extraction', () => {
  it('strips FILE/EDIT blocks and preserves surrounding text', () => {
    const input = `Before.
[FILE:a.ts]
code
[/FILE]
After.`;
    const result = parseAiResponse(input);
    expect(result.text).toContain('Before.');
    expect(result.text).toContain('After.');
    expect(result.text).not.toContain('[FILE:');
    expect(result.text).not.toContain('code');
  });
});

// ── Malformed / edge cases ──────────────────────────────────────────────────
describe('parseAiResponse – malformed input', () => {
  it('recovers truncated [FILE:] block without closing tag', () => {
    const input = '[FILE:broken.ts]\nsome code but no closing tag';
    const result = parseAiResponse(input);
    // Truncated blocks with >20 chars of content are recovered
    expect(result.type).toBe('full-file');
    expect(result.fullFiles['broken.ts']).toBe('some code but no closing tag');
  });

  it('ignores very short truncated [FILE:] block', () => {
    const input = '[FILE:x.ts]\nhi';
    const result = parseAiResponse(input);
    expect(result.type).toBe('text-only');
    expect(Object.keys(result.fullFiles)).toHaveLength(0);
  });

  it('ignores [EDIT:] block without closing tag', () => {
    const input = `[EDIT:broken.ts]
<<<<<<< SEARCH
old
=======
new
>>>>>>> REPLACE
no closing EDIT tag`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('text-only');
    expect(result.diffs).toHaveLength(0);
  });

  it('ignores [EDIT:] block with no valid SEARCH/REPLACE pairs inside', () => {
    const input = `[EDIT:file.ts]
This has no search replace markers
[/EDIT]`;
    const result = parseAiResponse(input);
    // The EDIT block is parsed but produces zero searchBlocks, so diffs is empty
    expect(result.diffs).toHaveLength(0);
    expect(result.type).toBe('text-only');
  });

  it('handles nested-looking but actually sequential blocks correctly', () => {
    const input = `[FILE:a.ts]
content a
[/FILE]
[FILE:b.ts]
content b
[/FILE]`;
    const result = parseAiResponse(input);
    expect(result.type).toBe('full-file');
    expect(Object.keys(result.fullFiles)).toHaveLength(2);
  });
});
