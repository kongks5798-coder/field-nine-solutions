/**
 * ShellInterface — abstraction layer for terminal shells.
 * Currently only MockShell implements this.
 * Future: WebContainer or real PTY backend can implement the same interface.
 */
export interface ShellInterface {
  /** Execute a command and yield output lines (supports async iteration). */
  execute(command: string): AsyncIterable<string>;

  /** Send interrupt signal (Ctrl+C). */
  interrupt(): void;

  /** Notify shell of terminal resize. */
  resize(cols: number, rows: number): void;

  /** Return current working directory. */
  getCwd(): string;

  /** Whether the shell is initialised and ready. */
  isReady(): boolean;
}
