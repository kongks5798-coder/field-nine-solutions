// ── Agent State Machine ──────────────────────────────────────────────────────
// Pure-function state machine for the AI coding agent lifecycle.
// No side-effects — safe to test and replay.

/** All possible agent states */
export type AgentState =
  | "idle"           // waiting for user input
  | "understanding"  // analyzing the prompt
  | "planning"       // building implementation plan
  | "coding"         // writing code
  | "reviewing"      // reviewing generated code
  | "testing"        // running automated tests
  | "applying"       // applying diff patches to files
  | "error"          // an error occurred
  | "complete";      // task finished

/** Events that drive state transitions */
export type AgentEvent =
  | { type: "START"; prompt: string }
  | { type: "STREAM_BEGIN" }
  | { type: "PHASE_CHANGE"; phase: "planning" | "coding" | "reviewing" }
  | { type: "DIFF_APPLY"; files: string[] }
  | { type: "AUTO_TEST" }
  | { type: "ERROR"; message: string }
  | { type: "COMPLETE" }
  | { type: "RESET" };

/** Runtime context carried alongside the state */
export interface AgentContext {
  state: AgentState;
  previousState: AgentState | null;
  startedAt: number | null;
  iterationCount: number;      // auto-retry iteration count
  maxIterations: number;       // cap for automatic retries (default 3)
  lastError: string | null;
  filesModified: string[];     // files touched in this session
  totalTokensUsed: number;     // cumulative tokens used
}

/** Create a fresh context (idle, zero counters). */
export function createInitialContext(maxIterations = 3): AgentContext {
  return {
    state: "idle",
    previousState: null,
    startedAt: null,
    iterationCount: 0,
    maxIterations,
    lastError: null,
    filesModified: [],
    totalTokensUsed: 0,
  };
}

/**
 * Pure transition function.
 *
 * Given the current context and an event, returns a new context.
 * Invalid transitions return the context unchanged (no-op).
 */
export function transition(ctx: AgentContext, event: AgentEvent): AgentContext {
  const next = { ...ctx, previousState: ctx.state };

  switch (event.type) {
    // ── START ────────────────────────────────────────────────────────────────
    case "START": {
      if (ctx.state === "idle") {
        return {
          ...next,
          state: "understanding",
          startedAt: Date.now(),
          lastError: null,
        };
      }
      // Retry from error state
      if (ctx.state === "error") {
        const newCount = ctx.iterationCount + 1;
        if (newCount >= ctx.maxIterations) {
          // Exhausted retries — go to complete
          return { ...next, state: "complete" };
        }
        return {
          ...next,
          state: "understanding",
          iterationCount: newCount,
          startedAt: Date.now(),
          lastError: null,
        };
      }
      return ctx; // no-op
    }

    // ── STREAM_BEGIN ─────────────────────────────────────────────────────────
    case "STREAM_BEGIN": {
      if (ctx.state === "understanding") {
        return { ...next, state: "planning" };
      }
      return ctx;
    }

    // ── PHASE_CHANGE ─────────────────────────────────────────────────────────
    case "PHASE_CHANGE": {
      if (event.phase === "coding" && (ctx.state === "planning" || ctx.state === "understanding")) {
        return { ...next, state: "coding" };
      }
      if (event.phase === "reviewing" && ctx.state === "coding") {
        return { ...next, state: "reviewing" };
      }
      if (event.phase === "planning" && ctx.state === "understanding") {
        return { ...next, state: "planning" };
      }
      return ctx;
    }

    // ── DIFF_APPLY ───────────────────────────────────────────────────────────
    case "DIFF_APPLY": {
      if (ctx.state === "reviewing" || ctx.state === "coding") {
        const merged = [...ctx.filesModified];
        for (const f of event.files) {
          if (!merged.includes(f)) merged.push(f);
        }
        return { ...next, state: "applying", filesModified: merged };
      }
      return ctx;
    }

    // ── AUTO_TEST ────────────────────────────────────────────────────────────
    case "AUTO_TEST": {
      if (ctx.state === "applying" || ctx.state === "complete") {
        return { ...next, state: "testing" };
      }
      return ctx;
    }

    // ── ERROR ────────────────────────────────────────────────────────────────
    case "ERROR": {
      return { ...next, state: "error", lastError: event.message };
    }

    // ── COMPLETE ─────────────────────────────────────────────────────────────
    case "COMPLETE": {
      return { ...next, state: "complete" };
    }

    // ── RESET ────────────────────────────────────────────────────────────────
    case "RESET": {
      return {
        ...createInitialContext(ctx.maxIterations),
        previousState: ctx.state,
        totalTokensUsed: ctx.totalTokensUsed,
      };
    }

    default:
      return ctx;
  }
}

/**
 * Derive the legacy `agentPhase` string from the new state.
 * Used for backward-compatibility with existing UI components.
 */
export function deriveAgentPhase(
  state: AgentState,
): "planning" | "coding" | "reviewing" | null {
  switch (state) {
    case "planning":
    case "understanding":
      return "planning";
    case "coding":
      return "coding";
    case "reviewing":
    case "applying":
    case "testing":
      return "reviewing";
    default:
      return null;
  }
}
