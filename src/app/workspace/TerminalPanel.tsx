"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { TOKEN_CLEAR, TOKEN_RUN_PROJECT, TOKEN_AI_PROMPT } from "./terminal/commands";
import { MockShell } from "./terminal/MockShell";
import { usePreviewStore } from "./stores/usePreviewStore";
import { useLayoutStore } from "./stores/useLayoutStore";
import { useAiStore } from "./stores/useAiStore";

// ── Props ──────────────────────────────────────────────────────────────────────

export interface TerminalPanelProps {
  /** Trigger runProject from parent (page.tsx passes this down) */
  onRunProject?: () => void;
  /** Trigger AI prompt from parent */
  onRunAI?: (prompt: string) => void;
}

// ── ANSI theme colours matching T object ───────────────────────────────────────

const THEME = {
  background:  "#050508",
  foreground:  "#d4d8e2",
  cursor:      "#f97316",
  cursorAccent:"#050508",
  selectionBackground:  "rgba(249,115,22,0.3)",
  selectionForeground:  undefined,
  selectionInactiveBackground: "rgba(249,115,22,0.15)",
  black:       "#0b0b14",
  red:         "#f87171",
  green:       "#22c55e",
  yellow:      "#fb923c",
  blue:        "#60a5fa",
  magenta:     "#c084fc",
  cyan:        "#22d3ee",
  white:       "#d4d8e2",
  brightBlack: "#4a5066",
  brightRed:   "#fca5a5",
  brightGreen: "#4ade80",
  brightYellow:"#fbbf24",
  brightBlue:  "#93c5fd",
  brightMagenta:"#d8b4fe",
  brightCyan:  "#67e8f9",
  brightWhite: "#f1f5f9",
};

// ── Component ──────────────────────────────────────────────────────────────────

function TerminalPanelInner({ onRunProject, onRunAI }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef  = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const shellRef = useRef<MockShell | null>(null);
  const inputBuffer = useRef("");
  const historyRef = useRef<string[]>([]);
  const historyIdx = useRef(-1);
  const savedInput = useRef("");
  const isExecuting = useRef(false);
  const mountedRef = useRef(true);

  const bottomTab = useLayoutStore(s => s.bottomTab);

  // Write prompt to terminal
  const writePrompt = useCallback(() => {
    const term = termRef.current;
    const shell = shellRef.current;
    if (!term || !shell) return;
    term.write(shell.getPrompt());
  }, []);

  // Execute a command
  const executeCommand = useCallback(async (line: string) => {
    const term = termRef.current;
    const shell = shellRef.current;
    if (!term || !shell) return;

    isExecuting.current = true;

    // Add to history (skip empty and duplicates)
    const trimmed = line.trim();
    if (trimmed && historyRef.current[historyRef.current.length - 1] !== trimmed) {
      historyRef.current.push(trimmed);
      if (historyRef.current.length > 100) historyRef.current.shift();
    }
    historyIdx.current = -1;
    savedInput.current = "";

    if (!trimmed) {
      writePrompt();
      isExecuting.current = false;
      return;
    }

    try {
      for await (const output of shell.execute(trimmed)) {
        if (!mountedRef.current) return;

        // Handle special tokens
        if (output === TOKEN_CLEAR) {
          term.clear();
          writePrompt();
          isExecuting.current = false;
          return;
        }
        if (output === TOKEN_RUN_PROJECT) {
          onRunProject?.();
          continue;
        }
        if (output.startsWith(TOKEN_AI_PROMPT)) {
          const prompt = output.slice(TOKEN_AI_PROMPT.length);
          onRunAI?.(prompt);
          continue;
        }
        term.writeln(output);
      }
    } catch (err) {
      term.writeln(`\x1b[31mError: ${String(err)}\x1b[0m`);
    }

    writePrompt();
    isExecuting.current = false;
  }, [writePrompt, onRunProject, onRunAI]);

  // Handle terminal data (keystrokes)
  const handleData = useCallback((data: string) => {
    const term = termRef.current;
    const shell = shellRef.current;
    if (!term || !shell) return;

    // Ignore input while executing
    if (isExecuting.current) {
      // Ctrl+C during execution
      if (data === "\x03") {
        shell.interrupt();
        term.writeln("");
        term.writeln("\x1b[31m^C\x1b[0m");
        writePrompt();
        isExecuting.current = false;
        inputBuffer.current = "";
      }
      return;
    }

    for (let i = 0; i < data.length; i++) {
      const ch = data[i];

      // Enter
      if (ch === "\r" || ch === "\n") {
        term.writeln("");
        const cmd = inputBuffer.current;
        inputBuffer.current = "";
        executeCommand(cmd);
        return;
      }

      // Ctrl+C
      if (ch === "\x03") {
        inputBuffer.current = "";
        term.writeln("^C");
        writePrompt();
        return;
      }

      // Ctrl+L — clear
      if (ch === "\x0c") {
        inputBuffer.current = "";
        term.clear();
        writePrompt();
        return;
      }

      // Backspace
      if (ch === "\x7f" || ch === "\b") {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }

      // Escape sequences (arrow keys etc)
      if (ch === "\x1b" && i + 2 < data.length && data[i + 1] === "[") {
        const code = data[i + 2];
        i += 2;

        // Up arrow — history back
        if (code === "A") {
          if (historyRef.current.length === 0) continue;
          if (historyIdx.current === -1) {
            savedInput.current = inputBuffer.current;
            historyIdx.current = historyRef.current.length - 1;
          } else if (historyIdx.current > 0) {
            historyIdx.current--;
          } else {
            continue;
          }
          // Clear current input from display
          const clearLen = inputBuffer.current.length;
          term.write("\b \b".repeat(clearLen));
          inputBuffer.current = historyRef.current[historyIdx.current];
          term.write(inputBuffer.current);
          continue;
        }

        // Down arrow — history forward
        if (code === "B") {
          if (historyIdx.current === -1) continue;
          const clearLen = inputBuffer.current.length;
          term.write("\b \b".repeat(clearLen));
          if (historyIdx.current < historyRef.current.length - 1) {
            historyIdx.current++;
            inputBuffer.current = historyRef.current[historyIdx.current];
          } else {
            historyIdx.current = -1;
            inputBuffer.current = savedInput.current;
          }
          term.write(inputBuffer.current);
          continue;
        }

        // Ignore other escape sequences (left, right, etc.)
        continue;
      }

      // Regular printable character
      if (ch >= " ") {
        inputBuffer.current += ch;
        term.write(ch);
      }
    }
  }, [executeCommand, writePrompt]);

  // Initialize terminal
  useEffect(() => {
    mountedRef.current = true;
    let terminal: import("@xterm/xterm").Terminal | null = null;
    let fitAddon: import("@xterm/addon-fit").FitAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let dataDisposable: import("@xterm/xterm").IDisposable | null = null;

    const init = async () => {
      if (!containerRef.current || !mountedRef.current) return;

      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);

      // Inject xterm CSS if not already present
      if (!document.querySelector('style[data-xterm-css]')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          await import("@xterm/xterm/css/xterm.css" as string);
        } catch {
          // Fallback: inject minimal essential styles for xterm rendering
          const style = document.createElement("style");
          style.setAttribute("data-xterm-css", "1");
          style.textContent = [
            ".xterm { position: relative; user-select: none; -ms-user-select: none; -webkit-user-select: none; }",
            ".xterm.focus, .xterm:focus { outline: none; }",
            ".xterm .xterm-helpers { position: absolute; top: 0; z-index: 5; }",
            ".xterm .xterm-helper-textarea { padding: 0; border: 0; margin: 0; position: absolute; opacity: 0; left: -9999em; top: 0; width: 0; height: 0; z-index: -5; white-space: nowrap; overflow: hidden; resize: none; }",
            ".xterm .composition-view { background: #000; color: #FFF; display: none; position: absolute; white-space: nowrap; z-index: 1; }",
            ".xterm .xterm-viewport { background-color: #000; overflow-y: scroll; cursor: default; position: absolute; right: 0; left: 0; top: 0; bottom: 0; }",
            ".xterm .xterm-screen { position: relative; }",
            ".xterm .xterm-screen canvas { position: absolute; left: 0; top: 0; }",
            ".xterm .xterm-scroll-area { visibility: hidden; }",
            ".xterm-char-measure-element { display: inline-block; visibility: hidden; position: absolute; top: 0; left: -9999em; line-height: normal; }",
            ".xterm.enable-mouse-events { cursor: default; }",
            ".xterm .xterm-cursor-layer { z-index: 4; }",
            ".xterm-underline-1 { text-decoration: underline; }",
            ".xterm-strikethrough-1 { text-decoration: line-through; }",
          ].join("\n");
          document.head.appendChild(style);
        }
      }

      if (!mountedRef.current || !containerRef.current) return;

      terminal = new Terminal({
        theme: THEME,
        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
        fontSize: 13,
        lineHeight: 1.3,
        cursorBlink: true,
        cursorStyle: "bar",
        allowTransparency: true,
        scrollback: 1000,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      const webLinksAddon = new WebLinksAddon();
      terminal.loadAddon(webLinksAddon);

      terminal.open(containerRef.current);

      // Initial fit
      try { fitAddon.fit(); } catch { /* container may not have dimensions yet */ }

      termRef.current = terminal;
      fitRef.current = fitAddon;

      // Create shell
      const shell = new MockShell();
      shellRef.current = shell;

      // Write welcome message
      for (const line of shell.getWelcomeMessage()) {
        terminal.writeln(line);
      }
      terminal.write(shell.getPrompt());

      // Listen for data (typed characters)
      dataDisposable = terminal.onData(handleData);

      // Notify shell of dimensions
      shell.resize(terminal.cols, terminal.rows);

      // ResizeObserver to keep terminal fitted
      resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon?.fit();
          if (terminal && shell) {
            shell.resize(terminal.cols, terminal.rows);
          }
        } catch { /* ignore sizing errors */ }
      });
      resizeObserver.observe(containerRef.current);
    };

    init();

    return () => {
      mountedRef.current = false;
      dataDisposable?.dispose();
      resizeObserver?.disconnect();
      fitAddon?.dispose();
      terminal?.dispose();
      termRef.current = null;
      fitRef.current = null;
      shellRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach data handler when callbacks change
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const disposable = term.onData(handleData);
    return () => disposable.dispose();
  }, [handleData]);

  // Fit when tab becomes visible
  useEffect(() => {
    if (bottomTab === "terminal") {
      setTimeout(() => {
        try { fitRef.current?.fit(); } catch { /* ignore */ }
      }, 50);
    }
  }, [bottomTab]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#050508",
        overflow: "hidden",
      }}
    />
  );
}

export default TerminalPanelInner;
