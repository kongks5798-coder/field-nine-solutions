/**
 * Application monitoring and error tracking utilities.
 * Provides structured error logging with optional Sentry integration.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  page?: string;
}

const LOG_BUFFER_KEY = "f9_error_log_v1";
const MAX_LOG_ENTRIES = 100;
const SESSION_ID = typeof crypto !== "undefined" ? crypto.randomUUID() : `s_${Date.now()}`;

function getLogBuffer(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_BUFFER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogBuffer(entries: LogEntry[]): void {
  try {
    localStorage.setItem(LOG_BUFFER_KEY, JSON.stringify(entries.slice(-MAX_LOG_ENTRIES)));
  } catch { /* ignore */ }
}

export function logEvent(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    sessionId: SESSION_ID,
    page: typeof window !== "undefined" ? window.location.pathname : undefined,
  };

  // Console output
  const consoleFn = level === "error" || level === "fatal" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(`[${level.toUpperCase()}] ${message}`, context || "");

  // Buffer to localStorage
  const buffer = getLogBuffer();
  buffer.push(entry);
  saveLogBuffer(buffer);

  // Send critical errors to server
  if (level === "error" || level === "fatal") {
    sendToServer(entry).catch(() => {});
  }
}

export function logError(error: Error, context?: Record<string, unknown>): void {
  logEvent("error", error.message, { ...context, stack: error.stack });
}

async function sendToServer(entry: LogEntry): Promise<void> {
  try {
    await fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch { /* fail silently */ }
}

export function getRecentErrors(limit = 20): LogEntry[] {
  return getLogBuffer().filter(e => e.level === "error" || e.level === "fatal").slice(-limit);
}

export function clearLogs(): void {
  try { localStorage.removeItem(LOG_BUFFER_KEY); } catch { /* ignore */ }
}

// Global error handler setup
export function initMonitoring(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    logEvent("error", event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
    logEvent("error", `Unhandled rejection: ${message}`, {
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}
