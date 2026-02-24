/**
 * Mock terminal command handlers.
 * Each command is an async generator that yields output lines.
 *
 * Commands access Zustand stores directly via getState() so they can read/write
 * the file system, editor, and preview stores without React context.
 */
import { useFileSystemStore } from "../stores/useFileSystemStore";
import { useGitStore } from "../stores/useGitStore";
import { usePackageStore } from "../stores/usePackageStore";
import { snapshotFromFiles, diffWorkingTree, getCommitLog } from "../git/VirtualGit";

// ── Special tokens returned by commands ────────────────────────────────────────
export const TOKEN_CLEAR = "__CLEAR__";
export const TOKEN_RUN_PROJECT = "__RUN_PROJECT__";
export const TOKEN_AI_PROMPT = "__AI_PROMPT__:";

// ── Types ──────────────────────────────────────────────────────────────────────
export type CommandHandler = (
  args: string[],
  cwd: string,
) => AsyncGenerator<string, void, unknown>;

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Resolve a path relative to cwd. Very simple — no ".." support yet. */
function resolvePath(cwd: string, target: string): string {
  if (target.startsWith("/") || target.startsWith("~/")) return target;
  if (cwd === "/" || cwd === "~/project") return target;
  return `${cwd}/${target}`;
}

// ── Command implementations ────────────────────────────────────────────────────

async function* cmdLs(_args: string[], _cwd: string): AsyncGenerator<string> {
  const files = useFileSystemStore.getState().files;
  const names = Object.keys(files).sort();
  if (names.length === 0) {
    yield "\x1b[33m(empty project)\x1b[0m";
    return;
  }
  for (const name of names) {
    const ext = name.split(".").pop() ?? "";
    const colorMap: Record<string, string> = {
      html: "\x1b[38;5;208m",  // orange
      css:  "\x1b[38;5;75m",   // blue
      js:   "\x1b[38;5;226m",  // yellow
      ts:   "\x1b[38;5;39m",   // cyan
      json: "\x1b[38;5;250m",  // gray
      md:   "\x1b[38;5;114m",  // green
      py:   "\x1b[38;5;141m",  // purple
    };
    const color = colorMap[ext] ?? "\x1b[37m";
    yield `${color}${name}\x1b[0m`;
  }
}

async function* cmdCat(args: string[], _cwd: string): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mcat: missing file operand\x1b[0m";
    return;
  }
  const files = useFileSystemStore.getState().files;
  const name = args[0];
  const file = files[name];
  if (!file) {
    yield `\x1b[31mcat: ${name}: No such file\x1b[0m`;
    return;
  }
  const lines = file.content.split("\n");
  for (const line of lines) {
    yield line;
  }
}

async function* cmdEcho(args: string[]): AsyncGenerator<string> {
  yield args.join(" ");
}

async function* cmdClear(): AsyncGenerator<string> {
  yield TOKEN_CLEAR;
}

async function* cmdHelp(): AsyncGenerator<string> {
  yield "\x1b[1;38;5;208mDalkak IDE Terminal\x1b[0m";
  yield "";
  yield "\x1b[1mAvailable commands:\x1b[0m";
  yield "  \x1b[38;5;208mls\x1b[0m              List project files";
  yield "  \x1b[38;5;208mcat\x1b[0m <file>       Print file content";
  yield "  \x1b[38;5;208mecho\x1b[0m <text>      Print text";
  yield "  \x1b[38;5;208mclear\x1b[0m            Clear terminal";
  yield "  \x1b[38;5;208mhelp\x1b[0m             Show this help";
  yield "  \x1b[38;5;208mcd\x1b[0m <dir>         Change directory (mock)";
  yield "  \x1b[38;5;208mpwd\x1b[0m              Print working directory";
  yield "  \x1b[38;5;208mopen\x1b[0m <file>      Open file in editor";
  yield "  \x1b[38;5;208mnew\x1b[0m <file>       Create new file";
  yield "  \x1b[38;5;208mnpm run dev\x1b[0m      Run project preview";
  yield "  \x1b[38;5;208mnpm run build\x1b[0m    Simulate build output";
  yield "  \x1b[38;5;208mnpm install\x1b[0m      Install a package";
  yield "  \x1b[38;5;208mnpm uninstall\x1b[0m    Remove a package";
  yield "  \x1b[38;5;208mnpm list\x1b[0m         List installed packages";
  yield "  \x1b[38;5;208mai\x1b[0m <prompt>      Send prompt to AI";
  yield "  \x1b[38;5;208mnode -e\x1b[0m <code>   Evaluate JavaScript";
  yield "";
  yield "\x1b[1mGit commands:\x1b[0m";
  yield "  \x1b[38;5;208mgit status\x1b[0m         Show changed files";
  yield "  \x1b[38;5;208mgit commit -m\x1b[0m      Create a commit";
  yield "  \x1b[38;5;208mgit log\x1b[0m            Show commit history";
  yield "  \x1b[38;5;208mgit branch\x1b[0m         List branches";
  yield "  \x1b[38;5;208mgit checkout\x1b[0m       Switch branch";
  yield "  \x1b[38;5;208mgit diff\x1b[0m           Show working changes";
  yield "";
  yield "\x1b[2mCtrl+C to interrupt  |  Ctrl+L to clear  |  Up/Down for history\x1b[0m";
}

async function* cmdPwd(_args: string[], cwd: string): AsyncGenerator<string> {
  yield cwd;
}

/** cd — update cwd. Returns new cwd as a special message. */
async function* cmdCd(args: string[], cwd: string): AsyncGenerator<string> {
  if (args.length === 0 || args[0] === "~" || args[0] === "~/project") {
    yield "__CD__:~/project";
    return;
  }
  const target = args[0];
  if (target === "..") {
    const parts = cwd.split("/").filter(Boolean);
    if (parts.length <= 1) {
      yield "__CD__:~/project";
    } else {
      parts.pop();
      yield `__CD__:${parts.join("/")}`;
    }
    return;
  }
  if (target === ".") {
    yield `__CD__:${cwd}`;
    return;
  }
  // Mock — we only have a flat file system, just accept the cd
  const resolved = resolvePath(cwd, target);
  yield `__CD__:${resolved}`;
}

async function* cmdOpen(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mopen: missing file operand\x1b[0m";
    return;
  }
  const name = args[0];
  const files = useFileSystemStore.getState().files;
  if (!files[name]) {
    yield `\x1b[31mopen: ${name}: No such file\x1b[0m`;
    return;
  }
  useFileSystemStore.getState().openFile(name);
  yield `\x1b[32mOpened ${name} in editor\x1b[0m`;
}

async function* cmdNew(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mnew: missing file name\x1b[0m";
    return;
  }
  const name = args[0];
  const files = useFileSystemStore.getState().files;
  if (files[name]) {
    yield `\x1b[33m${name} already exists — opening in editor\x1b[0m`;
    useFileSystemStore.getState().openFile(name);
    return;
  }
  useFileSystemStore.getState().createFile(name);
  yield `\x1b[32mCreated ${name}\x1b[0m`;
}

async function* cmdNpmRunDev(): AsyncGenerator<string> {
  yield "\x1b[36m> dalkak-ide@1.0.0 dev\x1b[0m";
  yield "\x1b[36m> next dev\x1b[0m";
  yield "";
  yield "\x1b[32m  ready\x1b[0m - started server on 0.0.0.0:3000, url: http://localhost:3000";
  yield TOKEN_RUN_PROJECT;
}

async function* cmdNpmRunBuild(): AsyncGenerator<string> {
  const files = useFileSystemStore.getState().files;
  const names = Object.keys(files);
  yield "\x1b[36m> dalkak-ide@1.0.0 build\x1b[0m";
  yield "\x1b[36m> next build\x1b[0m";
  yield "";
  yield "\x1b[1mCreating an optimised production build...\x1b[0m";
  // Simulate some delay
  yield "\x1b[32m\u2713\x1b[0m Compiled successfully";
  yield "";
  yield "\x1b[1mRoute (pages)                Size     First Load JS\x1b[0m";
  yield "\x1b[2m\u250C\x1b[0m \x1b[2m/\x1b[0m                          ";

  let totalSize = 0;
  for (const name of names) {
    const size = new Blob([files[name].content]).size;
    totalSize += size;
    const sizeStr = size < 1024
      ? `${size} B`
      : `${(size / 1024).toFixed(1)} kB`;
    yield `\x1b[2m\u251C\x1b[0m ${name.padEnd(25)} \x1b[38;5;208m${sizeStr.padStart(8)}\x1b[0m`;
  }
  const totalStr = totalSize < 1024
    ? `${totalSize} B`
    : `${(totalSize / 1024).toFixed(1)} kB`;
  yield `\x1b[2m\u2514\x1b[0m \x1b[1mTotal\x1b[0m${" ".repeat(20)} \x1b[38;5;208m${totalStr.padStart(8)}\x1b[0m`;
  yield "";
  yield `\x1b[32m\u2713\x1b[0m Build completed — ${names.length} files, ${totalStr} total`;
}

async function* cmdAi(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mai: missing prompt\x1b[0m";
    yield "\x1b[2mUsage: ai <your prompt here>\x1b[0m";
    return;
  }
  const prompt = args.join(" ");
  yield `\x1b[38;5;208m\u2726\x1b[0m Sending to AI: \x1b[2m"${prompt}"\x1b[0m`;
  yield `${TOKEN_AI_PROMPT}${prompt}`;
}

async function* cmdNodeEval(args: string[]): AsyncGenerator<string> {
  // args should already have -e stripped; join the rest as code
  const code = args.join(" ");
  if (!code.trim()) {
    yield "\x1b[31mnode: missing expression\x1b[0m";
    yield "\x1b[2mUsage: node -e \"console.log(1+1)\"\x1b[0m";
    return;
  }
  try {
    // Sandboxed eval — no DOM access
    const fn = new Function(
      "console",
      "document",
      "window",
      "globalThis",
      "fetch",
      "XMLHttpRequest",
      `"use strict";
       const __output = [];
       const __console = { log: (...a) => __output.push(a.map(String).join(" ")), error: (...a) => __output.push("ERROR: " + a.map(String).join(" ")), warn: (...a) => __output.push("WARN: " + a.map(String).join(" ")) };
       try { const __result = eval(${JSON.stringify(code)}); if (__result !== undefined && __output.length === 0) __output.push(String(__result)); }
       catch(e) { __output.push("ERROR: " + String(e)); }
       return __output;`,
    );
    const output: string[] = fn(undefined, undefined, undefined, undefined, undefined, undefined);
    for (const line of output) {
      if (line.startsWith("ERROR:")) {
        yield `\x1b[31m${line}\x1b[0m`;
      } else if (line.startsWith("WARN:")) {
        yield `\x1b[33m${line}\x1b[0m`;
      } else {
        yield line;
      }
    }
  } catch (err) {
    yield `\x1b[31mRuntimeError: ${String(err)}\x1b[0m`;
  }
}

// ── Git command implementations ──────────────────────────────────────────────

async function* cmdGit(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mgit: missing subcommand\x1b[0m";
    yield "\x1b[2mUsage: git status | commit -m \"msg\" | log | branch | checkout <name> | diff\x1b[0m";
    return;
  }

  const sub = args[0];

  if (sub === "status") {
    const gitState = useGitStore.getState().gitState;
    const files = useFileSystemStore.getState().files;
    const snapshot = snapshotFromFiles(files);
    const diffs = diffWorkingTree(gitState, snapshot);

    yield `\x1b[1mOn branch ${gitState.currentBranch}\x1b[0m`;
    if (diffs.length === 0) {
      yield "\x1b[32mnothing to commit, working tree clean\x1b[0m";
    } else {
      yield "";
      yield "\x1b[1mChanges not staged for commit:\x1b[0m";
      yield "";
      for (const d of diffs) {
        const color = d.status === "added" ? "\x1b[32m" : d.status === "deleted" ? "\x1b[31m" : "\x1b[33m";
        const prefix = d.status === "added" ? "new file:" : d.status === "deleted" ? "deleted:" : "modified:";
        yield `\t${color}${prefix.padEnd(12)} ${d.filename}\x1b[0m`;
      }
      yield "";
      yield `\x1b[2m${diffs.length} file(s) changed\x1b[0m`;
    }
    return;
  }

  if (sub === "commit") {
    // Parse -m "message" or -m message
    const mIdx = args.indexOf("-m");
    if (mIdx === -1 || mIdx + 1 >= args.length) {
      yield "\x1b[31mgit commit: missing -m \"message\"\x1b[0m";
      yield "\x1b[2mUsage: git commit -m \"your message\"\x1b[0m";
      return;
    }
    const message = args.slice(mIdx + 1).join(" ");
    if (!message.trim()) {
      yield "\x1b[31mgit commit: empty message\x1b[0m";
      return;
    }
    useGitStore.getState().commit(message);
    const newState = useGitStore.getState().gitState;
    const headId = newState.HEAD ?? "???";
    yield `\x1b[33m[${newState.currentBranch} ${headId}]\x1b[0m ${message}`;
    const commitObj = newState.commits.find(c => c.id === headId);
    const fileCount = commitObj ? Object.keys(commitObj.files).length : 0;
    yield ` ${fileCount} file(s) snapshot`;
    return;
  }

  if (sub === "log") {
    const gitState = useGitStore.getState().gitState;
    const log = getCommitLog(gitState, 20);
    if (log.length === 0) {
      yield "\x1b[33mNo commits yet\x1b[0m";
      return;
    }
    for (const commit of log) {
      yield `\x1b[33mcommit ${commit.id}\x1b[0m`;
      yield `Date:   ${new Date(commit.timestamp).toLocaleString()}`;
      yield "";
      yield `    ${commit.message}`;
      yield "";
    }
    return;
  }

  if (sub === "branch") {
    const gitState = useGitStore.getState().gitState;
    if (args.length > 1) {
      // git branch <name> → create branch
      const name = args[1];
      useGitStore.getState().branch(name);
      yield `\x1b[32mCreated branch '${name}'\x1b[0m`;
      return;
    }
    // List branches
    for (const b of gitState.branches) {
      const marker = b.name === gitState.currentBranch ? "* " : "  ";
      const color = b.name === gitState.currentBranch ? "\x1b[32m" : "";
      const reset = b.name === gitState.currentBranch ? "\x1b[0m" : "";
      yield `${marker}${color}${b.name}${reset}`;
    }
    return;
  }

  if (sub === "checkout") {
    if (args.length < 2) {
      yield "\x1b[31mgit checkout: missing branch name\x1b[0m";
      yield "\x1b[2mUsage: git checkout <branch-name>\x1b[0m";
      return;
    }
    const branchName = args[1];
    // Check with -b flag for create + checkout
    if (branchName === "-b" && args.length >= 3) {
      const newName = args[2];
      useGitStore.getState().branch(newName);
      useGitStore.getState().checkout(newName);
      yield `\x1b[32mSwitched to new branch '${newName}'\x1b[0m`;
      return;
    }
    const gitState = useGitStore.getState().gitState;
    if (!gitState.branches.some(b => b.name === branchName)) {
      yield `\x1b[31merror: pathspec '${branchName}' did not match any branch\x1b[0m`;
      return;
    }
    useGitStore.getState().checkout(branchName);
    yield `\x1b[32mSwitched to branch '${branchName}'\x1b[0m`;
    return;
  }

  if (sub === "diff") {
    const gitState = useGitStore.getState().gitState;
    const files = useFileSystemStore.getState().files;
    const snapshot = snapshotFromFiles(files);
    const diffs = diffWorkingTree(gitState, snapshot);

    if (diffs.length === 0) {
      yield "\x1b[32mNo changes\x1b[0m";
      return;
    }

    for (const d of diffs) {
      yield `\x1b[1mdiff --git a/${d.filename} b/${d.filename}\x1b[0m`;
      if (d.status === "added") {
        yield `\x1b[32m--- /dev/null\x1b[0m`;
        yield `\x1b[32m+++ b/${d.filename}\x1b[0m`;
        for (const line of d.newContent.split("\n").slice(0, 30)) {
          yield `\x1b[32m+${line}\x1b[0m`;
        }
      } else if (d.status === "deleted") {
        yield `\x1b[31m--- a/${d.filename}\x1b[0m`;
        yield `\x1b[31m+++ /dev/null\x1b[0m`;
        for (const line of d.oldContent.split("\n").slice(0, 30)) {
          yield `\x1b[31m-${line}\x1b[0m`;
        }
      } else {
        yield `--- a/${d.filename}`;
        yield `+++ b/${d.filename}`;
        // Show simple diff: old lines as red, new lines as green (first 30 lines each)
        const oldLines = d.oldContent.split("\n").slice(0, 20);
        const newLines = d.newContent.split("\n").slice(0, 20);
        for (const line of oldLines) {
          yield `\x1b[31m-${line}\x1b[0m`;
        }
        for (const line of newLines) {
          yield `\x1b[32m+${line}\x1b[0m`;
        }
      }
      yield "";
    }
    return;
  }

  yield `\x1b[31mgit: '${sub}' is not a git command\x1b[0m`;
  yield "\x1b[2mAvailable: status, commit, log, branch, checkout, diff\x1b[0m";
}

async function* cmdNpmInstall(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mnpm install: missing package name\x1b[0m";
    yield "\x1b[2mUsage: npm install <package-name>\x1b[0m";
    return;
  }
  const isDev = args.includes("-D") || args.includes("--save-dev");
  const pkgNames = args.filter(a => !a.startsWith("-"));
  for (const name of pkgNames) {
    yield `\x1b[36m> Installing ${name}...\x1b[0m`;
    try {
      await usePackageStore.getState().installPackage(name, undefined, isDev);
      const status = usePackageStore.getState().installStatus;
      const error = usePackageStore.getState().installError;
      if (status === "error" || error) {
        yield `\x1b[31m✗ ${error ?? "Installation failed"}\x1b[0m`;
      } else {
        yield `\x1b[32m✓ ${name} installed\x1b[0m`;
      }
    } catch (err) {
      yield `\x1b[31m✗ ${String(err)}\x1b[0m`;
    }
  }
}

async function* cmdNpmUninstall(args: string[]): AsyncGenerator<string> {
  if (args.length === 0) {
    yield "\x1b[31mnpm uninstall: missing package name\x1b[0m";
    return;
  }
  for (const name of args) {
    usePackageStore.getState().uninstallPackage(name);
    yield `\x1b[32m✓ ${name} removed\x1b[0m`;
  }
}

async function* cmdNpmList(): AsyncGenerator<string> {
  const pkgs = usePackageStore.getState().packages;
  if (pkgs.length === 0) {
    yield "\x1b[33m(no packages installed)\x1b[0m";
    return;
  }
  yield "\x1b[1mInstalled packages:\x1b[0m";
  for (const p of pkgs) {
    const tag = p.type === "devDep" ? " \x1b[38;5;75m[dev]\x1b[0m" : "";
    yield `  \x1b[38;5;208m${p.name}\x1b[0m@${p.version}${tag}`;
  }
  yield `\n\x1b[2m${pkgs.length} package(s)\x1b[0m`;
}

async function* cmdUnknown(cmd: string): AsyncGenerator<string> {
  yield `\x1b[31mcommand not found: ${cmd}\x1b[0m`;
  yield "\x1b[2mType 'help' for available commands\x1b[0m";
}

// ── Registry ───────────────────────────────────────────────────────────────────

export const COMMANDS: Record<string, CommandHandler> = {
  ls:    cmdLs,
  cat:   cmdCat,
  echo:  cmdEcho,
  clear: cmdClear,
  help:  cmdHelp,
  pwd:   cmdPwd,
  cd:    cmdCd,
  open:  cmdOpen,
  new:   cmdNew,
};

/**
 * Dispatch a parsed command line to the appropriate handler.
 * Returns an async generator of output lines.
 */
export function dispatchCommand(
  cmd: string,
  args: string[],
  cwd: string,
): AsyncGenerator<string, void, unknown> {
  // Handle npm multi-word commands
  if (cmd === "npm") {
    const sub = args.join(" ");
    if (sub === "run dev" || sub === "start") return cmdNpmRunDev();
    if (sub === "run build" || sub === "build") return cmdNpmRunBuild();
    if (args[0] === "install" || args[0] === "i" || args[0] === "add") {
      return cmdNpmInstall(args.slice(1));
    }
    if (args[0] === "uninstall" || args[0] === "remove" || args[0] === "rm") {
      return cmdNpmUninstall(args.slice(1));
    }
    if (sub === "list" || sub === "ls") return cmdNpmList();
    return cmdUnknown(`npm ${sub}`);
  }

  // Handle node -e <code>
  if (cmd === "node") {
    if (args[0] === "-e" || args[0] === "--eval") {
      return cmdNodeEval(args.slice(1));
    }
    return cmdUnknown("node (only 'node -e <code>' is supported)");
  }

  // Handle ai <prompt>
  if (cmd === "ai") {
    return cmdAi(args);
  }

  // Handle git subcommands
  if (cmd === "git") {
    return cmdGit(args);
  }

  const handler = COMMANDS[cmd];
  if (handler) return handler(args, cwd);

  return cmdUnknown(cmd);
}
