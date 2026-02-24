import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock useFileSystemStore ─────────────────────────────────────────────────
const { mockOpenFile, mockCreateFile, mockGetState } = vi.hoisted(() => {
  const mockOpenFile = vi.fn();
  const mockCreateFile = vi.fn();
  const mockGetState = vi.fn(() => ({
    files: {
      'index.html': { name: 'index.html', language: 'html', content: '<h1>Hello</h1>' },
      'style.css': { name: 'style.css', language: 'css', content: 'body { margin: 0; }' },
      'script.js': { name: 'script.js', language: 'javascript', content: 'console.log(1);' },
    },
    openFile: mockOpenFile,
    createFile: mockCreateFile,
  }));
  return { mockOpenFile, mockCreateFile, mockGetState };
});

vi.mock('@/app/workspace/stores/useFileSystemStore', () => ({
  useFileSystemStore: {
    getState: mockGetState,
  },
}));

import {
  dispatchCommand,
  TOKEN_CLEAR,
  TOKEN_RUN_PROJECT,
  TOKEN_AI_PROMPT,
  COMMANDS,
} from '@/app/workspace/terminal/commands';

/** Collect all lines from an async generator into an array. */
async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const lines: string[] = [];
  for await (const line of gen) {
    lines.push(line);
  }
  return lines;
}

const CWD = '~/project';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to default mock files
  mockGetState.mockReturnValue({
    files: {
      'index.html': { name: 'index.html', language: 'html', content: '<h1>Hello</h1>' },
      'style.css': { name: 'style.css', language: 'css', content: 'body { margin: 0; }' },
      'script.js': { name: 'script.js', language: 'javascript', content: 'console.log(1);' },
    },
    openFile: mockOpenFile,
    createFile: mockCreateFile,
  });
});

// ── echo ────────────────────────────────────────────────────────────────────
describe('echo command', () => {
  it('outputs joined args', async () => {
    const lines = await collect(dispatchCommand('echo', ['hello'], CWD));
    expect(lines).toEqual(['hello']);
  });

  it('outputs multiple args joined with spaces', async () => {
    const lines = await collect(dispatchCommand('echo', ['hello', 'world'], CWD));
    expect(lines).toEqual(['hello world']);
  });

  it('outputs empty string with no args', async () => {
    const lines = await collect(dispatchCommand('echo', [], CWD));
    expect(lines).toEqual(['']);
  });
});

// ── pwd ─────────────────────────────────────────────────────────────────────
describe('pwd command', () => {
  it('outputs the current working directory', async () => {
    const lines = await collect(dispatchCommand('pwd', [], CWD));
    expect(lines).toEqual([CWD]);
  });

  it('reflects a custom cwd', async () => {
    const lines = await collect(dispatchCommand('pwd', [], '/home/user'));
    expect(lines).toEqual(['/home/user']);
  });
});

// ── cd ──────────────────────────────────────────────────────────────────────
describe('cd command', () => {
  it('cd <dir> yields __CD__:<dir> token', async () => {
    const lines = await collect(dispatchCommand('cd', ['src'], CWD));
    expect(lines).toEqual(['__CD__:src']);
  });

  it('cd with no args yields __CD__:~/project', async () => {
    const lines = await collect(dispatchCommand('cd', [], CWD));
    expect(lines).toEqual(['__CD__:~/project']);
  });

  it('cd ~ yields __CD__:~/project', async () => {
    const lines = await collect(dispatchCommand('cd', ['~'], CWD));
    expect(lines).toEqual(['__CD__:~/project']);
  });

  it('cd .. from "~/project" goes up to ~', async () => {
    const lines = await collect(dispatchCommand('cd', ['..'], '~/project'));
    expect(lines).toEqual(['__CD__:~']);
  });

  it('cd .. from deeper path pops last segment', async () => {
    const lines = await collect(dispatchCommand('cd', ['..'], '~/project/src/components'));
    expect(lines).toEqual(['__CD__:~/project/src']);
  });

  it('cd . stays in same directory', async () => {
    const lines = await collect(dispatchCommand('cd', ['.'], CWD));
    expect(lines).toEqual([`__CD__:${CWD}`]);
  });
});

// ── help ────────────────────────────────────────────────────────────────────
describe('help command', () => {
  it('outputs multiple lines including command names', async () => {
    const lines = await collect(dispatchCommand('help', [], CWD));
    expect(lines.length).toBeGreaterThan(5);
    const joined = lines.join('\n');
    expect(joined).toContain('ls');
    expect(joined).toContain('cat');
    expect(joined).toContain('echo');
    expect(joined).toContain('help');
    expect(joined).toContain('cd');
    expect(joined).toContain('pwd');
    expect(joined).toContain('open');
    expect(joined).toContain('new');
  });
});

// ── clear ───────────────────────────────────────────────────────────────────
describe('clear command', () => {
  it('yields TOKEN_CLEAR', async () => {
    const lines = await collect(dispatchCommand('clear', [], CWD));
    expect(lines).toEqual([TOKEN_CLEAR]);
    expect(lines[0]).toBe('__CLEAR__');
  });
});

// ── npm run dev ─────────────────────────────────────────────────────────────
describe('npm run dev', () => {
  it('yields TOKEN_RUN_PROJECT in its output', async () => {
    const lines = await collect(dispatchCommand('npm', ['run', 'dev'], CWD));
    expect(lines).toContain(TOKEN_RUN_PROJECT);
    expect(lines.some((l) => l === '__RUN_PROJECT__')).toBe(true);
  });
});

// ── ai <prompt> ─────────────────────────────────────────────────────────────
describe('ai command', () => {
  it('yields __AI_PROMPT__:prompt token with the prompt text', async () => {
    const lines = await collect(dispatchCommand('ai', ['fix', 'my', 'code'], CWD));
    expect(lines.length).toBe(2);
    expect(lines[1]).toBe(`${TOKEN_AI_PROMPT}fix my code`);
  });

  it('yields error when no prompt provided', async () => {
    const lines = await collect(dispatchCommand('ai', [], CWD));
    expect(lines[0]).toContain('missing prompt');
  });
});

// ── ls ──────────────────────────────────────────────────────────────────────
describe('ls command', () => {
  it('lists all project files', async () => {
    const lines = await collect(dispatchCommand('ls', [], CWD));
    expect(lines.length).toBe(3);
    const plain = lines.map((l) => l.replace(/\x1b\[[^m]*m/g, ''));
    expect(plain).toContain('index.html');
    expect(plain).toContain('style.css');
    expect(plain).toContain('script.js');
  });

  it('shows "(empty project)" when no files exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetState.mockReturnValue({ files: {}, openFile: mockOpenFile, createFile: mockCreateFile } as any);
    const lines = await collect(dispatchCommand('ls', [], CWD));
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('empty project');
  });
});

// ── cat ─────────────────────────────────────────────────────────────────────
describe('cat command', () => {
  it('outputs file content line by line', async () => {
    const lines = await collect(dispatchCommand('cat', ['index.html'], CWD));
    expect(lines).toEqual(['<h1>Hello</h1>']);
  });

  it('yields error for missing file operand', async () => {
    const lines = await collect(dispatchCommand('cat', [], CWD));
    expect(lines[0]).toContain('missing file operand');
  });

  it('yields error for non-existent file', async () => {
    const lines = await collect(dispatchCommand('cat', ['nope.txt'], CWD));
    expect(lines[0]).toContain('No such file');
    expect(lines[0]).toContain('nope.txt');
  });
});

// ── open ────────────────────────────────────────────────────────────────────
describe('open command', () => {
  it('calls openFile on the store and yields success message', async () => {
    const lines = await collect(dispatchCommand('open', ['index.html'], CWD));
    expect(mockOpenFile).toHaveBeenCalledWith('index.html');
    const plain = lines[0].replace(/\x1b\[[^m]*m/g, '');
    expect(plain).toContain('Opened index.html');
  });

  it('yields error for missing operand', async () => {
    const lines = await collect(dispatchCommand('open', [], CWD));
    expect(lines[0]).toContain('missing file operand');
  });

  it('yields error for non-existent file', async () => {
    const lines = await collect(dispatchCommand('open', ['nope.txt'], CWD));
    expect(lines[0]).toContain('No such file');
  });
});

// ── new ─────────────────────────────────────────────────────────────────────
describe('new command', () => {
  it('calls createFile for a new file and yields success', async () => {
    const lines = await collect(dispatchCommand('new', ['app.tsx'], CWD));
    expect(mockCreateFile).toHaveBeenCalledWith('app.tsx');
    const plain = lines[0].replace(/\x1b\[[^m]*m/g, '');
    expect(plain).toContain('Created app.tsx');
  });

  it('opens existing file instead of creating a duplicate', async () => {
    const lines = await collect(dispatchCommand('new', ['index.html'], CWD));
    expect(mockCreateFile).not.toHaveBeenCalled();
    expect(mockOpenFile).toHaveBeenCalledWith('index.html');
    const plain = lines[0].replace(/\x1b\[[^m]*m/g, '');
    expect(plain).toContain('already exists');
  });

  it('yields error when no file name provided', async () => {
    const lines = await collect(dispatchCommand('new', [], CWD));
    expect(lines[0]).toContain('missing file name');
  });
});

// ── COMMANDS registry ───────────────────────────────────────────────────────
describe('COMMANDS registry', () => {
  it('contains all expected commands', () => {
    const expected = ['ls', 'cat', 'echo', 'clear', 'help', 'pwd', 'cd', 'open', 'new'];
    for (const cmd of expected) {
      expect(COMMANDS).toHaveProperty(cmd);
      expect(typeof COMMANDS[cmd]).toBe('function');
    }
  });
});

// ── Unknown command ─────────────────────────────────────────────────────────
describe('unknown command', () => {
  it('yields "command not found" for unrecognised commands', async () => {
    const lines = await collect(dispatchCommand('foobar', [], CWD));
    expect(lines[0]).toContain('command not found');
    expect(lines[0]).toContain('foobar');
    expect(lines[1]).toContain('help');
  });
});
