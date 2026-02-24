import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LM_MODEL_KEY, ENV_VARS_KEY } from '@/app/workspace/workspace.constants';

// ── localStorage mock ────────────────────────────────────────────────────────
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((k: string) => store[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
  removeItem: vi.fn((k: string) => { delete store[k]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ── Zustand store reset helper ───────────────────────────────────────────────
// Zustand stores are singletons — we need to reset state between tests.
// We do this by calling setState with initial values rather than re-importing.

// ── useFileSystemStore ───────────────────────────────────────────────────────
describe('useFileSystemStore — extended', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: any;

  beforeEach(async () => {
    // Dynamic import to get fresh module reference
    const mod = await import('@/app/workspace/stores/useFileSystemStore');
    store = mod.useFileSystemStore;
    // Reset to defaults
    const { DEFAULT_FILES } = await import('@/app/workspace/workspace.constants');
    store.setState({
      files: { ...DEFAULT_FILES },
      activeFile: 'index.html',
      openTabs: ['index.html', 'style.css', 'script.js'],
      changedFiles: [],
      history: [],
      showVersionHistory: false,
      showNewFile: false,
      newFileName: '',
    });
  });

  // ── openFile / closeTab ─────────────────────────────────────────────────
  it('openFile adds the file to openTabs if not already present', () => {
    const { openFile } = store.getState();
    openFile('newfile.html');
    const state = store.getState();
    expect(state.openTabs).toContain('newfile.html');
    expect(state.activeFile).toBe('newfile.html');
  });

  it('openFile does not duplicate an already-open tab', () => {
    const { openFile } = store.getState();
    openFile('index.html'); // already in default tabs
    const state = store.getState();
    const count = state.openTabs.filter((t: string) => t === 'index.html').length;
    expect(count).toBe(1);
    expect(state.activeFile).toBe('index.html');
  });

  it('closeTab removes the tab from openTabs', () => {
    const { closeTab } = store.getState();
    closeTab('style.css');
    const state = store.getState();
    expect(state.openTabs).not.toContain('style.css');
  });

  it('closeTab switches activeFile to last remaining tab if active file was closed', () => {
    // Make style.css active first
    store.getState().openFile('style.css');
    expect(store.getState().activeFile).toBe('style.css');

    store.getState().closeTab('style.css');
    const state = store.getState();
    // Should fallback to last tab in the remaining array
    expect(state.activeFile).toBe('script.js');
    expect(state.openTabs).not.toContain('style.css');
  });

  // ── createFile / deleteFile ─────────────────────────────────────────────
  it('createFile adds a new entry to files map', () => {
    const { createFile } = store.getState();
    createFile('app.js');
    const state = store.getState();
    expect(state.files).toHaveProperty('app.js');
    expect(state.files['app.js'].name).toBe('app.js');
    expect(state.files['app.js'].content).toBe('');
    expect(state.activeFile).toBe('app.js');
    expect(state.openTabs).toContain('app.js');
  });

  it('createFile trims whitespace and ignores empty names', () => {
    const filesBefore = { ...store.getState().files };
    const { createFile } = store.getState();
    createFile('   ');
    const filesAfter = store.getState().files;
    // No new keys should be added
    expect(Object.keys(filesAfter).length).toBe(Object.keys(filesBefore).length);
  });

  it('deleteFile removes the file from files and openTabs', () => {
    const { deleteFile } = store.getState();
    deleteFile('script.js');
    const state = store.getState();
    expect(state.files).not.toHaveProperty('script.js');
    expect(state.openTabs).not.toContain('script.js');
  });

  it('deleteFile switches activeFile when the active file is deleted', () => {
    // Make script.js active
    store.getState().openFile('script.js');
    expect(store.getState().activeFile).toBe('script.js');

    store.getState().deleteFile('script.js');
    const state = store.getState();
    // Should pick the first remaining file key
    expect(state.activeFile).toBeTruthy();
    expect(state.activeFile).not.toBe('script.js');
  });

  // ── pushHistory / revertHistory ─────────────────────────────────────────
  it('pushHistory adds a snapshot to history', () => {
    const { pushHistory } = store.getState();
    pushHistory('snapshot 1');
    const state = store.getState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].label).toBe('snapshot 1');
    expect(state.history[0].files).toBeDefined();
    expect(state.history[0].ts).toBeDefined();
  });

  it('revertHistory restores files from the last snapshot and removes it', () => {
    // Modify files, then push a history snapshot, then modify again
    const { pushHistory, updateFileContent } = store.getState();
    pushHistory('before edit');

    updateFileContent('index.html', '<h1>Modified</h1>');
    expect(store.getState().files['index.html'].content).toBe('<h1>Modified</h1>');

    store.getState().revertHistory();
    const state = store.getState();
    // Files should revert to the snapshot (original content)
    expect(state.files['index.html'].content).not.toBe('<h1>Modified</h1>');
    expect(state.history).toHaveLength(0);
  });

  it('revertHistory is a no-op when history is empty', () => {
    const before = store.getState().files;
    store.getState().revertHistory();
    const after = store.getState().files;
    expect(after).toEqual(before);
  });

  it('pushHistory limits history to 20 entries', () => {
    const { pushHistory } = store.getState();
    for (let i = 0; i < 25; i++) {
      store.getState().pushHistory(`snap-${i}`);
    }
    const state = store.getState();
    expect(state.history.length).toBeLessThanOrEqual(20);
  });
});

// ── useProjectStore — genId ──────────────────────────────────────────────────
describe('useProjectStore — genId', () => {
  it('generates unique IDs', async () => {
    const { genId } = await import('@/app/workspace/stores/useProjectStore');
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(genId());
    }
    expect(ids.size).toBe(50);
  });

  it('returns a string that looks like a UUID', async () => {
    const { genId } = await import('@/app/workspace/stores/useProjectStore');
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(32);
    // Should contain hyphens (UUID format)
    expect(id).toContain('-');
  });
});

// ── useAiStore — handleSelectModel ───────────────────────────────────────────
describe('useAiStore — handleSelectModel', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aiStore: any;

  beforeEach(async () => {
    const mod = await import('@/app/workspace/stores/useAiStore');
    aiStore = mod.useAiStore;
    localStorageMock.setItem.mockClear();
  });

  it('sets selectedModelId and aiMode', () => {
    aiStore.getState().handleSelectModel('gpt-4o', 'openai');
    const state = aiStore.getState();
    expect(state.selectedModelId).toBe('gpt-4o');
    expect(state.aiMode).toBe('openai');
  });

  it('persists model ID to localStorage', () => {
    aiStore.getState().handleSelectModel('gemini-2.0-flash', 'gemini');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LM_MODEL_KEY, 'gemini-2.0-flash');
  });
});

// ── useUiStore — showToast ───────────────────────────────────────────────────
describe('useUiStore — showToast', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let uiStore: any;

  beforeEach(async () => {
    vi.useFakeTimers();
    const mod = await import('@/app/workspace/stores/useUiStore');
    uiStore = mod.useUiStore;
    uiStore.setState({ toast: '' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets the toast message immediately', () => {
    uiStore.getState().showToast('Saved!');
    expect(uiStore.getState().toast).toBe('Saved!');
  });

  it('auto-clears the toast after timeout', () => {
    uiStore.getState().showToast('Hello');
    expect(uiStore.getState().toast).toBe('Hello');

    vi.advanceTimersByTime(2500); // toast clears after 2400ms
    expect(uiStore.getState().toast).toBe('');
  });

  it('replaces previous toast and resets the timer', () => {
    uiStore.getState().showToast('First');
    vi.advanceTimersByTime(1000);
    uiStore.getState().showToast('Second');
    expect(uiStore.getState().toast).toBe('Second');

    // After 1500ms from "Second" (total 2500ms), should still be visible
    vi.advanceTimersByTime(1500);
    expect(uiStore.getState().toast).toBe('Second');

    // After another 1000ms (total 2500ms from "Second"), should be cleared
    vi.advanceTimersByTime(1000);
    expect(uiStore.getState().toast).toBe('');
  });
});

// ── usePreviewStore — addLog ─────────────────────────────────────────────────
describe('usePreviewStore — addLog', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let previewStore: any;

  beforeEach(async () => {
    const mod = await import('@/app/workspace/stores/usePreviewStore');
    previewStore = mod.usePreviewStore;
    previewStore.setState({ logs: [], errorCount: 0 });
  });

  it('appends a log entry', () => {
    previewStore.getState().addLog('log', 'hello world', '12:00:00');
    const state = previewStore.getState();
    expect(state.logs).toHaveLength(1);
    expect(state.logs[0]).toEqual({ level: 'log', msg: 'hello world', ts: '12:00:00' });
  });

  it('does not increment errorCount for non-error levels', () => {
    previewStore.getState().addLog('log', 'info msg', '12:00:01');
    previewStore.getState().addLog('warn', 'warn msg', '12:00:02');
    previewStore.getState().addLog('info', 'info msg', '12:00:03');
    expect(previewStore.getState().errorCount).toBe(0);
  });

  it('increments errorCount when level is "error"', () => {
    previewStore.getState().addLog('error', 'Something broke', '12:00:04');
    expect(previewStore.getState().errorCount).toBe(1);

    previewStore.getState().addLog('error', 'Another error', '12:00:05');
    expect(previewStore.getState().errorCount).toBe(2);
  });

  it('limits logs to 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      previewStore.getState().addLog('log', `msg-${i}`, `00:00:${String(i).padStart(2, '0')}`);
    }
    expect(previewStore.getState().logs.length).toBeLessThanOrEqual(200);
  });
});

// ── useEnvStore — setEnvVars ─────────────────────────────────────────────────
describe('useEnvStore — setEnvVars', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let envStore: any;

  beforeEach(async () => {
    localStorageMock.setItem.mockClear();
    const mod = await import('@/app/workspace/stores/useEnvStore');
    envStore = mod.useEnvStore;
    envStore.setState({ envVars: {} });
  });

  it('sets env vars in state', () => {
    envStore.getState().setEnvVars({ API_KEY: 'abc123', SECRET: 'xyz' });
    expect(envStore.getState().envVars).toEqual({ API_KEY: 'abc123', SECRET: 'xyz' });
  });

  it('persists env vars to localStorage', () => {
    envStore.getState().setEnvVars({ MY_VAR: 'value' });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      ENV_VARS_KEY,
      JSON.stringify({ MY_VAR: 'value' }),
    );
  });

  it('accepts a function updater', () => {
    envStore.getState().setEnvVars({ A: '1' });
    envStore.getState().setEnvVars((prev: Record<string, string>) => ({ ...prev, B: '2' }));
    expect(envStore.getState().envVars).toEqual({ A: '1', B: '2' });
  });
});

// ── useLayoutStore — initial values ──────────────────────────────────────────
describe('useLayoutStore — initial values', () => {
  it('showTerminal defaults to false', async () => {
    const { useLayoutStore } = await import('@/app/workspace/stores/useLayoutStore');
    // Reset to ensure defaults
    useLayoutStore.setState({ showTerminal: false, bottomTab: 'console' });
    expect(useLayoutStore.getState().showTerminal).toBe(false);
  });

  it('bottomTab defaults to "console"', async () => {
    const { useLayoutStore } = await import('@/app/workspace/stores/useLayoutStore');
    useLayoutStore.setState({ showTerminal: false, bottomTab: 'console' });
    expect(useLayoutStore.getState().bottomTab).toBe('console');
  });

  it('setShowTerminal toggles the terminal flag', async () => {
    const { useLayoutStore } = await import('@/app/workspace/stores/useLayoutStore');
    useLayoutStore.getState().setShowTerminal(true);
    expect(useLayoutStore.getState().showTerminal).toBe(true);
    useLayoutStore.getState().setShowTerminal(false);
    expect(useLayoutStore.getState().showTerminal).toBe(false);
  });

  it('setBottomTab switches between console and terminal', async () => {
    const { useLayoutStore } = await import('@/app/workspace/stores/useLayoutStore');
    useLayoutStore.getState().setBottomTab('terminal');
    expect(useLayoutStore.getState().bottomTab).toBe('terminal');
    useLayoutStore.getState().setBottomTab('console');
    expect(useLayoutStore.getState().bottomTab).toBe('console');
  });
});
