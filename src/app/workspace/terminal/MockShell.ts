/**
 * MockShell — browser-side command interpreter implementing ShellInterface.
 * Parses command lines, dispatches to command handlers, and maintains CWD state.
 */
import type { ShellInterface } from "./ShellInterface";
import { dispatchCommand } from "./commands";

/** Simple command-line tokenizer that handles double and single quotes. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === " " && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

export class MockShell implements ShellInterface {
  private cwd = "~/project";
  private ready = true;
  private interrupted = false;
  private cols = 80;
  private rows = 24;

  constructor() {
    // Shell is ready immediately
  }

  /** Return the welcome banner shown on first open. */
  getWelcomeMessage(): string[] {
    return [
      "\x1b[1;38;5;208m ____        _ _         _     \x1b[0m",
      "\x1b[1;38;5;208m|  _ \\  __ _| | | ____ _| | __ \x1b[0m",
      "\x1b[1;38;5;208m| | | |/ _` | | |/ / _` | |/ / \x1b[0m",
      "\x1b[1;38;5;208m| |_| | (_| | |   < (_| |   <  \x1b[0m",
      "\x1b[1;38;5;208m|____/ \\__,_|_|_|\\_\\__,_|_|\\_\\ \x1b[0m",
      "",
      "\x1b[2mDalkak IDE Terminal v1.0 — Type 'help' for commands\x1b[0m",
      "",
    ];
  }

  /** Build the prompt string with ANSI colors. */
  getPrompt(): string {
    return `\x1b[38;5;208m${this.cwd}\x1b[0m \x1b[38;5;245m$\x1b[0m `;
  }

  async *execute(command: string): AsyncIterable<string> {
    this.interrupted = false;
    const trimmed = command.trim();
    if (!trimmed) return;

    const tokens = tokenize(trimmed);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const gen = dispatchCommand(cmd, args, this.cwd);
    for await (const line of gen) {
      if (this.interrupted) {
        yield "\x1b[31m^C\x1b[0m";
        return;
      }

      // Handle cd: update CWD from special token
      if (line.startsWith("__CD__:")) {
        this.cwd = line.slice(7);
        continue; // don't print the token
      }

      yield line;
    }
  }

  interrupt(): void {
    this.interrupted = true;
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
  }

  getCwd(): string {
    return this.cwd;
  }

  isReady(): boolean {
    return this.ready;
  }
}
