/**
 * ShellManager — switches between MockShell and WebContainerShell.
 * Manages lifecycle, fallback, and exposes a unified API for TerminalPanel.
 */
import type { ShellInterface } from "./ShellInterface";
import { MockShell } from "./MockShell";
import type { WebContainerShell } from "./WebContainerShell";

export type ShellMode = "mock" | "webcontainer";

export class ShellManager {
  private mockShell: MockShell;
  private wcShell: WebContainerShell | null = null;
  private activeMode: ShellMode = "mock";
  private _wcBootError: string | null = null;

  constructor() {
    this.mockShell = new MockShell();
  }

  // ── Mode switching ──────────────────────────────────────────────────────────

  /**
   * Enable WebContainer mode. Dynamically imports and boots the WebContainerShell.
   * If files are provided they are mounted after boot.
   * Returns void on success; throws on failure (caller should fallback).
   */
  async enableWebContainer(
    files?: Record<string, { content: string }>,
    onServerReady?: (port: number, url: string) => void,
  ): Promise<void> {
    this._wcBootError = null;

    try {
      // Dynamic import — avoid SSR bundling
      const { WebContainerShell: WCShell } = await import("./WebContainerShell");

      if (!this.wcShell) {
        this.wcShell = new WCShell();
      }

      await this.wcShell.boot();

      if (files && Object.keys(files).length > 0) {
        await this.wcShell.mountFiles(files);
      }

      if (onServerReady) {
        this.wcShell.onServerReady(onServerReady);
      }

      this.activeMode = "webcontainer";
    } catch (err) {
      this._wcBootError = String(err);
      this.activeMode = "mock";
      throw err;
    }
  }

  /** Fall back to mock mode (does not teardown the WC — call teardown() for that). */
  fallbackToMock(): void {
    this.activeMode = "mock";
  }

  /** Completely tear down WebContainer and fall back to mock mode. */
  teardownWebContainer(): void {
    if (this.wcShell) {
      this.wcShell.teardown();
      this.wcShell = null;
    }
    this.activeMode = "mock";
    this._wcBootError = null;
  }

  // ── Active shell passthrough ────────────────────────────────────────────────

  /** Get the currently active shell instance. */
  getActiveShell(): ShellInterface & { getWelcomeMessage(): string[]; getPrompt(): string } {
    if (this.activeMode === "webcontainer" && this.wcShell) {
      return this.wcShell;
    }
    return this.mockShell;
  }

  /** Execute a command on the active shell. */
  execute(command: string): AsyncIterable<string> {
    return this.getActiveShell().execute(command);
  }

  interrupt(): void {
    this.getActiveShell().interrupt();
  }

  resize(cols: number, rows: number): void {
    this.getActiveShell().resize(cols, rows);
  }

  getCwd(): string {
    return this.getActiveShell().getCwd();
  }

  isReady(): boolean {
    return this.getActiveShell().isReady();
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  getActiveMode(): ShellMode {
    return this.activeMode;
  }

  isWebContainerReady(): boolean {
    return this.wcShell?.isReady() ?? false;
  }

  getWebContainerServerUrl(): string | null {
    return this.wcShell?.getServerUrl() ?? null;
  }

  getBootError(): string | null {
    return this._wcBootError;
  }

  /** Get the mock shell (always available). */
  getMockShell(): MockShell {
    return this.mockShell;
  }

  /** Get the WebContainer shell (may be null). */
  getWebContainerShell(): WebContainerShell | null {
    return this.wcShell;
  }
}
