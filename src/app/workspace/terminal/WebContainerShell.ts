/**
 * WebContainerShell — real Node.js runtime in the browser via @webcontainer/api.
 * Implements ShellInterface so it can be swapped in place of MockShell.
 *
 * IMPORTANT: This module must be dynamically imported (SSR-incompatible).
 */
import type { WebContainer, WebContainerProcess, FileSystemTree } from "@webcontainer/api";
import type { ShellInterface } from "./ShellInterface";

export class WebContainerShell implements ShellInterface {
  private container: WebContainer | null = null;
  private booting = false;
  private bootPromise: Promise<void> | null = null;
  private cwd = "/home/project";
  private ready = false;
  private currentProcess: WebContainerProcess | null = null;
  private serverUrl: string | null = null;
  private cols = 80;
  private rows = 24;
  private serverReadyListeners: Array<(port: number, url: string) => void> = [];

  /** Boot the WebContainer (idempotent — only boots once). */
  async boot(): Promise<void> {
    if (this.container) return;
    if (this.bootPromise) return this.bootPromise;

    this.booting = true;
    this.bootPromise = this._doBoot();
    return this.bootPromise;
  }

  private async _doBoot(): Promise<void> {
    try {
      const { WebContainer: WC } = await import("@webcontainer/api");
      this.container = await WC.boot({
        coep: "credentialless",
        workdirName: "project",
        forwardPreviewErrors: true,
      });

      // Capture dev-server URLs
      this.container.on("server-ready", (port: number, url: string) => {
        this.serverUrl = url;
        for (const fn of this.serverReadyListeners) {
          fn(port, url);
        }
      });

      this.cwd = this.container.workdir;
      this.ready = true;
    } catch (err) {
      this.ready = false;
      throw err;
    } finally {
      this.booting = false;
    }
  }

  /** Mount a flat record of files into the WebContainer filesystem. */
  async mountFiles(files: Record<string, { content: string }>): Promise<void> {
    if (!this.container) throw new Error("WebContainer not booted");

    const tree: FileSystemTree = {};
    for (const [name, { content }] of Object.entries(files)) {
      // Support nested paths like "src/index.ts" by splitting on "/"
      const parts = name.split("/");
      let current: FileSystemTree = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts[i];
        if (!current[dir]) {
          current[dir] = { directory: {} };
        }
        const node = current[dir];
        if ("directory" in node) {
          current = node.directory;
        }
      }
      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: content } };
    }

    await this.container.mount(tree);
  }

  /** Execute a command inside the WebContainer and yield output chunks. */
  async *execute(command: string): AsyncIterable<string> {
    if (!this.container) {
      yield "\x1b[31mWebContainer is not booted. Run 'wc:boot' first.\x1b[0m";
      return;
    }

    const trimmed = command.trim();
    if (!trimmed) return;

    // Parse command + args
    const parts = this._tokenize(trimmed);
    const cmd = parts[0];
    const args = parts.slice(1);

    let process: WebContainerProcess;
    try {
      process = await this.container.spawn(cmd, args, {
        terminal: { cols: this.cols, rows: this.rows },
      });
    } catch (err) {
      yield `\x1b[31mSpawn error: ${String(err)}\x1b[0m`;
      return;
    }

    this.currentProcess = process;

    // Read output stream
    const reader = process.output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          // WebContainer output may contain multiple lines; yield as-is
          // (xterm handles ANSI escape sequences natively)
          yield value;
        }
      }
    } catch {
      // Stream cancelled (e.g. process killed)
    } finally {
      reader.releaseLock();
      this.currentProcess = null;
    }

    const exitCode = await process.exit;
    if (exitCode !== 0) {
      yield `\x1b[33mProcess exited with code ${exitCode}\x1b[0m`;
    }
  }

  /** Send Ctrl+C to the running process. */
  interrupt(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    if (this.currentProcess) {
      try {
        this.currentProcess.resize({ cols, rows });
      } catch {
        // Process may have already exited
      }
    }
  }

  getCwd(): string {
    return this.cwd;
  }

  isReady(): boolean {
    return this.ready;
  }

  /** Returns the dev server URL captured from the "server-ready" event, or null. */
  getServerUrl(): string | null {
    return this.serverUrl;
  }

  /** Register a callback for when a dev server becomes ready. */
  onServerReady(listener: (port: number, url: string) => void): () => void {
    this.serverReadyListeners.push(listener);
    return () => {
      this.serverReadyListeners = this.serverReadyListeners.filter((fn) => fn !== listener);
    };
  }

  /** Tear down the WebContainer (frees resources). */
  teardown(): void {
    if (this.container) {
      this.container.teardown();
      this.container = null;
      this.ready = false;
      this.serverUrl = null;
      this.currentProcess = null;
      this.serverReadyListeners = [];
    }
  }

  /** Return the welcome banner for WebContainer mode. */
  getWelcomeMessage(): string[] {
    return [
      "\x1b[1;38;5;208m ____        _ _         _     \x1b[0m",
      "\x1b[1;38;5;208m|  _ \\  __ _| | | ____ _| | __ \x1b[0m",
      "\x1b[1;38;5;208m| | | |/ _` | | |/ / _` | |/ / \x1b[0m",
      "\x1b[1;38;5;208m| |_| | (_| | |   < (_| |   <  \x1b[0m",
      "\x1b[1;38;5;208m|____/ \\__,_|_|_|\\_\\__,_|_|\\_\\ \x1b[0m",
      "",
      "\x1b[1;32mWebContainer Mode\x1b[0m \u2014 Real Node.js runtime in the browser",
      "\x1b[2mType 'help' for commands  |  npm, node, npx all work natively\x1b[0m",
      "",
    ];
  }

  /** Build the prompt string with ANSI colors. */
  getPrompt(): string {
    const shortCwd = this.cwd.replace(/^\/home\/project\/?/, "~/project/").replace(/\/$/, "") || "~/project";
    return `\x1b[1;32mwc\x1b[0m:\x1b[38;5;208m${shortCwd}\x1b[0m \x1b[38;5;245m$\x1b[0m `;
  }

  /** Simple tokenizer that handles quotes. */
  private _tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
      if (ch === " " && !inSingle && !inDouble) {
        if (current.length > 0) { tokens.push(current); current = ""; }
        continue;
      }
      current += ch;
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
  }
}
