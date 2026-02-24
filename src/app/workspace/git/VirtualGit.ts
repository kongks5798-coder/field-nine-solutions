/**
 * VirtualGit — Pure-function virtual Git implementation for browser-based
 * commit history, branching, and diff. No real Git involved.
 *
 * All functions are pure: they take a GitState and return a new GitState.
 */

import type { FilesMap } from "../workspace.constants";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GitCommit {
  id: string;
  message: string;
  timestamp: string; // ISO 8601
  files: Record<string, string>; // snapshot: filename -> content
  parent: string | null;
}

export interface GitBranch {
  name: string;
  headCommitId: string;
}

export interface GitState {
  commits: GitCommit[];
  branches: GitBranch[];
  currentBranch: string;
  HEAD: string | null; // current commit ID
}

export interface FileDiff {
  filename: string;
  status: "added" | "modified" | "deleted";
  oldContent: string;
  newContent: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Generate a 7-char hex hash. */
function shortHash(): string {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 7; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

/** Convert FilesMap (FileNode objects) to a flat string map (filename -> content). */
export function snapshotFromFiles(files: FilesMap): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const [name, node] of Object.entries(files)) {
    snap[name] = node.content;
  }
  return snap;
}

// ── Core Functions ─────────────────────────────────────────────────────────────

export function createInitialGitState(): GitState {
  return {
    commits: [],
    branches: [{ name: "main", headCommitId: "" }],
    currentBranch: "main",
    HEAD: null,
  };
}

export function createCommit(
  state: GitState,
  message: string,
  files: Record<string, string>,
): GitState {
  const id = shortHash();
  const commit: GitCommit = {
    id,
    message,
    timestamp: new Date().toISOString(),
    files: { ...files },
    parent: state.HEAD,
  };

  const commits = [...state.commits, commit];
  const branches = state.branches.map((b) =>
    b.name === state.currentBranch ? { ...b, headCommitId: id } : b,
  );

  return {
    ...state,
    commits,
    branches,
    HEAD: id,
  };
}

export function createBranch(state: GitState, name: string): GitState {
  // Don't allow duplicate branch names
  if (state.branches.some((b) => b.name === name)) {
    return state;
  }

  const newBranch: GitBranch = {
    name,
    headCommitId: state.HEAD ?? "",
  };

  return {
    ...state,
    branches: [...state.branches, newBranch],
  };
}

export function switchBranch(state: GitState, name: string): GitState {
  const branch = state.branches.find((b) => b.name === name);
  if (!branch) return state;

  return {
    ...state,
    currentBranch: name,
    HEAD: branch.headCommitId || null,
  };
}

export function getCommitLog(state: GitState, limit?: number): GitCommit[] {
  // Walk backwards from HEAD through the parent chain
  if (!state.HEAD) return [];

  const commitMap = new Map<string, GitCommit>();
  for (const c of state.commits) commitMap.set(c.id, c);

  const log: GitCommit[] = [];
  let current: string | null = state.HEAD;
  while (current) {
    const commit = commitMap.get(current);
    if (!commit) break;
    log.push(commit);
    current = commit.parent;
    if (limit && log.length >= limit) break;
  }
  return log;
}

export function diffCommits(commitA: GitCommit, commitB: GitCommit): FileDiff[] {
  const diffs: FileDiff[] = [];
  const allFiles = new Set([
    ...Object.keys(commitA.files),
    ...Object.keys(commitB.files),
  ]);

  for (const filename of allFiles) {
    const oldContent = commitA.files[filename] ?? "";
    const newContent = commitB.files[filename] ?? "";

    if (!(filename in commitA.files)) {
      diffs.push({ filename, status: "added", oldContent: "", newContent });
    } else if (!(filename in commitB.files)) {
      diffs.push({ filename, status: "deleted", oldContent, newContent: "" });
    } else if (oldContent !== newContent) {
      diffs.push({ filename, status: "modified", oldContent, newContent });
    }
  }

  return diffs.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Diff the current working files against the HEAD commit.
 * Returns an array of FileDiff representing uncommitted changes.
 */
export function diffWorkingTree(
  state: GitState,
  currentFiles: Record<string, string>,
): FileDiff[] {
  if (!state.HEAD) {
    // No commits yet — everything is "added"
    return Object.keys(currentFiles)
      .sort()
      .map((filename) => ({
        filename,
        status: "added" as const,
        oldContent: "",
        newContent: currentFiles[filename],
      }));
  }

  const headCommit = state.commits.find((c) => c.id === state.HEAD);
  if (!headCommit) return [];

  const diffs: FileDiff[] = [];
  const allFiles = new Set([
    ...Object.keys(headCommit.files),
    ...Object.keys(currentFiles),
  ]);

  for (const filename of allFiles) {
    const oldContent = headCommit.files[filename] ?? "";
    const newContent = currentFiles[filename] ?? "";

    if (!(filename in headCommit.files)) {
      diffs.push({ filename, status: "added", oldContent: "", newContent });
    } else if (!(filename in currentFiles)) {
      diffs.push({ filename, status: "deleted", oldContent, newContent: "" });
    } else if (oldContent !== newContent) {
      diffs.push({ filename, status: "modified", oldContent, newContent });
    }
  }

  return diffs.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Get the files snapshot from a specific commit, or null if not found.
 */
export function getCommitFiles(
  state: GitState,
  commitId: string,
): Record<string, string> | null {
  const commit = state.commits.find((c) => c.id === commitId);
  return commit ? { ...commit.files } : null;
}
