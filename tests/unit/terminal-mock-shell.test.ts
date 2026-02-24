import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Zustand store before importing MockShell (commands.ts imports it)
vi.mock('@/app/workspace/stores/useFileSystemStore', () => ({
  useFileSystemStore: {
    getState: vi.fn(() => ({
      files: {},
      openFile: vi.fn(),
      createFile: vi.fn(),
    })),
  },
}));

import { MockShell } from '@/app/workspace/terminal/MockShell';

/** Collect all lines from an async iterable into an array. */
async function collect(iter: AsyncIterable<string>): Promise<string[]> {
  const lines: string[] = [];
  for await (const line of iter) {
    lines.push(line);
  }
  return lines;
}

// ── MockShell creation & initial state ──────────────────────────────────────
describe('MockShell — creation & initial state', () => {
  let shell: MockShell;

  beforeEach(() => {
    shell = new MockShell();
  });

  it('getCwd() returns "~/project" by default', () => {
    expect(shell.getCwd()).toBe('~/project');
  });

  it('isReady() returns true immediately after construction', () => {
    expect(shell.isReady()).toBe(true);
  });

  it('getWelcomeMessage() returns a non-empty array of strings', () => {
    const msg = shell.getWelcomeMessage();
    expect(Array.isArray(msg)).toBe(true);
    expect(msg.length).toBeGreaterThan(0);
    msg.forEach((line) => expect(typeof line).toBe('string'));
  });
});

// ── execute() ───────────────────────────────────────────────────────────────
describe('MockShell — execute()', () => {
  let shell: MockShell;

  beforeEach(() => {
    shell = new MockShell();
  });

  it('echo "hello" produces ["hello"]', async () => {
    const lines = await collect(shell.execute('echo hello'));
    expect(lines).toEqual(['hello']);
  });

  it('handles quoted arguments: echo "hello world"', async () => {
    const lines = await collect(shell.execute('echo "hello world"'));
    expect(lines).toEqual(['hello world']);
  });

  it('handles single-quoted arguments: echo \'foo bar\'', async () => {
    const lines = await collect(shell.execute("echo 'foo bar'"));
    expect(lines).toEqual(['foo bar']);
  });

  it('empty command produces no output', async () => {
    const lines = await collect(shell.execute(''));
    expect(lines).toEqual([]);
  });

  it('whitespace-only command produces no output', async () => {
    const lines = await collect(shell.execute('   '));
    expect(lines).toEqual([]);
  });

  it('unknown command yields error message', async () => {
    const lines = await collect(shell.execute('doesnotexist'));
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines[0]).toContain('command not found');
    expect(lines[0]).toContain('doesnotexist');
  });

  it('cd updates cwd (does not emit the __CD__ token)', async () => {
    const lines = await collect(shell.execute('cd src'));
    // __CD__ token is consumed internally; no visible output
    expect(lines).toEqual([]);
    expect(shell.getCwd()).toBe('src');
  });

  it('pwd after cd reflects new directory', async () => {
    await collect(shell.execute('cd mydir'));
    const lines = await collect(shell.execute('pwd'));
    expect(lines).toEqual(['mydir']);
  });
});

// ── interrupt() ─────────────────────────────────────────────────────────────
describe('MockShell — interrupt()', () => {
  it('interrupt() is callable without error', () => {
    const shell = new MockShell();
    expect(() => shell.interrupt()).not.toThrow();
  });
});

// ── resize() ────────────────────────────────────────────────────────────────
describe('MockShell — resize()', () => {
  it('resize() accepts cols and rows without error', () => {
    const shell = new MockShell();
    expect(() => shell.resize(120, 40)).not.toThrow();
  });
});

// ── getPrompt() ─────────────────────────────────────────────────────────────
describe('MockShell — getPrompt()', () => {
  it('prompt contains cwd string', () => {
    const shell = new MockShell();
    const prompt = shell.getPrompt();
    expect(prompt).toContain('~/project');
  });

  it('prompt contains $ symbol', () => {
    const shell = new MockShell();
    const prompt = shell.getPrompt();
    expect(prompt).toContain('$');
  });

  it('prompt updates after cd', async () => {
    const shell = new MockShell();
    await collect(shell.execute('cd newdir'));
    const prompt = shell.getPrompt();
    expect(prompt).toContain('newdir');
    expect(prompt).not.toContain('~/project');
  });
});
